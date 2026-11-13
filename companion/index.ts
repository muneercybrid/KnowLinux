#!/usr/bin/env bun
import * as readline from "node:readline"
import os from 'os'
import fs from 'fs'
import path from 'path'

const API_URL = 'https://knowlinux.tech/api/companion'
const CONFIG_DIR = path.join(os.homedir(), '.knowlinux')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const STATUS_FILE = path.join(CONFIG_DIR, 'status.json')

async function authenticate() {
  console.log('🔗 Connecting to KnowLinux...')
  const res = await fetch(`${API_URL}/device-code`, { method: 'POST' })
  const data: any = await res.json()
  console.log(`\n=========================================`)
  console.log(`Please go to: ${data.verificationUri}`)
  console.log(`And enter the code: ${data.code}`)
  console.log(`=========================================\n`)
  console.log(`Waiting for authorization...`)
  while (true) {
    await new Promise(r => setTimeout(r, 3000))
    const pollRes = await fetch(`${API_URL}/token?deviceCode=${data.deviceCode}`)
    const pollData: any = await pollRes.json()
    if (pollRes.ok) {
      if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true })
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ token: pollData.token }, null, 2))
      console.log('✅ Successfully connected! You can now scan your system.')
      return
    }
    if (pollData.error !== 'authorization_pending') {
      console.error('❌ Authorization failed or expired.')
      process.exit(1)
    }
  }
}

async function scanSystem() {
  console.log('Scanning your Linux system...')
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('Not connected. Run knowlinux connect first.')
    return
  }
  const { token } = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  const osRelease = fs.existsSync('/etc/os-release') ? fs.readFileSync('/etc/os-release', 'utf8') : ''
  const distro = osRelease.match(/PRETTY_NAME="(.+)"/)?.[1] || 'Unknown Linux'
  console.log('   Distro: ' + distro)
  console.log('   Kernel: ' + os.release())
  console.log('   Arch: ' + os.arch())
  console.log('   Hostname: ' + os.hostname())
  console.log('Checking for updates...')
  const upgradable: Record<string, string> = {}
  try {
    const proc = Bun.spawn(['bash', '-c', 'apt list --upgradable 2>/dev/null'], { stdout: 'pipe' })
    const output = await new Response(proc.stdout).text()
    output.split('\n').forEach(line => {
      const match = line.match(/^([^/]+)\/[^\s]+\s+([^\s]+)\s+[^\s]+\s+\[upgradable from:/)
      if (match) upgradable[match[1]] = match[2]
    })
    console.log('   ' + Object.keys(upgradable).length + ' packages can be upgraded')
  } catch (e) {
    console.log('   Could not check upgradable packages')
  }
  console.log('Reading installed packages...')
  let packages: any[] = []
  const classify = (name: string): { type: string; executablePath: string | null } => {
    const clean = name.split(':')[0]
    const appDirs = ['/usr/share/applications', '/usr/local/share/applications']
    for (const dir of appDirs) {
      const p = dir + '/' + clean + '.desktop'
      if (fs.existsSync(p)) return { type: 'app', executablePath: p }
    }
    const binDirs = ['/usr/bin', '/usr/local/bin', '/bin', '/sbin', '/usr/sbin']
    for (const dir of binDirs) {
      const p = dir + '/' + clean
      try {
        const st = fs.statSync(p)
        if (st.isFile() && (st.mode & 0o111)) return { type: 'tool', executablePath: p }
      } catch (e) {}
    }
    if (clean.startsWith('lib') || clean.endsWith('-dev') || clean.endsWith('-doc') || clean.endsWith('-dbg')) {
      return { type: 'library', executablePath: null }
    }
    return { type: 'package', executablePath: null }
  }
  try {
    const proc = Bun.spawn(['dpkg-query', '-W', '-f', '${Package}|${Version}|${binary:Summary}\n'], {
      stdout: 'pipe',
    })
    const output = await new Response(proc.stdout).text()
    packages = output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split('|')
        if (parts.length < 3) return null
        const [name, version, description] = parts
        if (!/^[a-z0-9][a-z0-9.+-]*$/i.test(name.trim())) return null
        const cleanName = name.trim()
        const info = classify(cleanName)
        const latest = upgradable[cleanName]
        return {
          name: cleanName,
          version: version.trim(),
          description: description.trim(),
          type: info.type,
          executablePath: info.executablePath,
          latestVersion: latest || null,
          isOutdated: !!latest
        }
      })
      .filter((p): p is any => p !== null)
    const counts: Record<string, number> = {}
    for (const p of packages) counts[p.type] = (counts[p.type] || 0) + 1
    console.log('   Found ' + packages.length + ' packages: ' + JSON.stringify(counts))
  } catch (e) {
    console.log('   Could not read packages via dpkg')
  }
  console.log('Uploading to KnowLinux...')
  const res = await fetch(API_URL + '/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ distro, kernel: os.release(), hostname: os.hostname(), arch: os.arch(), packages })
  })
  if (res.ok) {
    const data = await res.json()
    console.log('Scan complete! Uploaded ' + data.packagesCount + ' packages.')
  } else {
    console.error('Upload failed:', await res.text())
  }
}
async function pollCommands() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('Not connected. Run knowlinux connect first.')
    return
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  const { token } = config
  const autoExecute = config.autoExecute === true
  const auditLog = path.join(CONFIG_DIR, 'audit.log')
  const isRoot = process.getuid?.() === 0
  const currentUser = os.userInfo().username || 'user'

  console.log('Listening for commands from KnowLinux (polling every 1s)...')
  if (autoExecute) {
    console.log('AUTO-EXECUTE ENABLED - commands run without confirmation')
  } else {
    console.log('CONFIRM MODE - you will be prompted before each command')
  }
  console.log('Press Ctrl+C to stop.\n')

  let rl: readline.Interface | null = null
  const hasTTY = process.stdin.isTTY === true
  if (!autoExecute && hasTTY) {
    try {
      rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    } catch (e) {}
  }

  const startedAt = Date.now()
  let commandsExecuted = 0
  const saveStatus = () => {
    try {
      fs.writeFileSync(STATUS_FILE, JSON.stringify({
        startedAt, lastPollAt: new Date().toISOString(),
        commandsExecuted, autoExecute, pid: process.pid
      }, null, 2))
    } catch (e) {}
  }

  const sessionState = { cwd: os.homedir(), prevCwd: os.homedir() }
  let cachedSudoPassword: string | null = null
  let isRootSession = false

  const executeCommand = async (cmd: any): Promise<{ output: string; exitCode: number; cwdBefore: string; cwdAfter: string }> => {
    const command = cmd.command.trim()
    const cwdBefore = sessionState.cwd
    const cwdEscaped = JSON.stringify(sessionState.cwd)

    // Cache password when provided
    if (cmd.sudoPassword) cachedSudoPassword = cmd.sudoPassword

    // Handle "sudo su" / "sudo -i" / "su" as root session toggle
    if (/^(sudo\s+su|sudo\s+-i|sudo\s+-s|su\s*-|su)$/.test(command)) {
      if (!cachedSudoPassword && !isRoot) {
        return { output: '[sudo] password required - click the sudo button and enter password', exitCode: 1, cwdBefore, cwdAfter: cwdBefore }
      }
      isRootSession = true
      return { output: '[Root session activated] Subsequent commands run as root. Type "exit" to end.', exitCode: 0, cwdBefore, cwdAfter: cwdBefore }
    }

    if (isRootSession && /^(exit|logout)$/.test(command)) {
      isRootSession = false
      return { output: '[Left root session]', exitCode: 0, cwdBefore, cwdAfter: cwdBefore }
    }

    const useSudo = cmd.requiresSudo || isRootSession
    const password = cachedSudoPassword

    try {
      let proc: any
      
      if (useSudo && !isRoot && password) {
        // Strip redundant sudo if user typed it
        const strippedCmd = command.replace(/^sudo\s+/, '')
        const wrapped = `cd ${cwdEscaped} 2>/dev/null; echo ${JSON.stringify(password)} | sudo -S -p '' bash -c ${JSON.stringify(strippedCmd)}; echo "__KL_CWD__$(pwd)"`
        proc = Bun.spawn(['bash', '-c', wrapped], { stdout: 'pipe', stderr: 'pipe' })
      } else if (useSudo && !isRoot && !password) {
        return { output: '[sudo] password required - click the sudo button and enter password', exitCode: 1, cwdBefore, cwdAfter: cwdBefore }
      } else {
        // Regular command OR already root
        const strippedCmd = isRoot ? command : command
        const wrapped = `cd ${cwdEscaped} 2>/dev/null; ${strippedCmd}; echo "__KL_CWD__$(pwd)"`
        proc = Bun.spawn(['bash', '-c', wrapped], { stdout: 'pipe', stderr: 'pipe' })
      }

      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      const exitCode = await proc.exited

      const cwdMatch = stdout.match(/__KL_CWD__([^\n]*)/)
      let cwdAfter = sessionState.cwd
      let cleanStdout = stdout
      if (cwdMatch) {
        const newCwd = cwdMatch[1].trim()
        cleanStdout = stdout.replace(/__KL_CWD__[^\n]*/, '').trimEnd()
        if (newCwd && newCwd.startsWith('/')) {
          sessionState.prevCwd = sessionState.cwd
          sessionState.cwd = newCwd
          cwdAfter = newCwd
        }
      }

      const output = cleanStdout + (stderr ? (cleanStdout ? '\n' : '') + stderr : '')

      // If sudo password was wrong, clear cache
      if (useSudo && /incorrect password|Sorry, try again/i.test(output)) {
        cachedSudoPassword = null
      }

      return { output, exitCode, cwdBefore, cwdAfter }
    } catch (e: any) {
      return { output: 'Execution failed: ' + e.message, exitCode: -1, cwdBefore, cwdAfter: sessionState.cwd }
    }
  }

  while (true) {
    try {
      const res = await fetch(`${API_URL}/pending-commands`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const commands: any[] = await res.json()
        for (const cmd of commands) {
          console.log(`\nCommand received: ${cmd.command}`)
          let shouldExecute = autoExecute
          if (!autoExecute) {
            if (rl) {
              const answer = await new Promise<string>((resolve) => {
                rl!.question('Execute this command? (y/N): ', (ans) => resolve(ans.trim().toLowerCase()))
              })
              shouldExecute = answer === 'y'
            }
          }

          if (shouldExecute) {
            console.log('Executing...')
            const timestamp = new Date().toISOString()
            const result = await executeCommand(cmd)
            console.log(`Exit code: ${result.exitCode}`)
            if (result.output) console.log(result.output)
            console.log(`CWD: ${result.cwdAfter}`)

            commandsExecuted++
            saveStatus()
            try {
              fs.appendFileSync(auditLog, `[${timestamp}] CMD: ${cmd.command} | EXIT: ${result.exitCode}\n`)
            } catch(e) {}

            const resultRes = await fetch(`${API_URL}/commands/${cmd.id}/result`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                output: result.output,
                exitCode: result.exitCode,
                cwdBefore: result.cwdBefore,
                cwdAfter: result.cwdAfter,
                userName: currentUser
              })
            })
            if (!resultRes.ok) {
              console.error(`Failed to post: ${resultRes.status}`)
            } else {
              console.log('Result uploaded')
            }
          } else {
            console.log('Rejected.')
            await fetch(`${API_URL}/commands/${cmd.id}/result`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ output: 'Rejected.', exitCode: -1, cwdBefore: sessionState.cwd, cwdAfter: sessionState.cwd })
            })
          }
        }
      }
    } catch (e) {}
    saveStatus()
    await new Promise(r => setTimeout(r, 1000))
  }
}

function toggleAuto() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('❌ Not connected.')
    return
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  config.autoExecute = !config.autoExecute
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  if (config.autoExecute) {
    console.log('⚠️  AUTO-EXECUTE IS NOW ON')
    console.log('   Commands from the web UI will execute WITHOUT confirmation.')
    console.log('   Anyone with access to your KnowLinux account can run commands here.')
    console.log('   Run "toggle-auto" again to disable.')
  } else {
    console.log('🔒 AUTO-EXECUTE IS NOW OFF')
    console.log('   You will be prompted before each command.')
  }
}

function showStatus() {
  const GREEN = '\x1b[32m'
  const YELLOW = '\x1b[33m'
  const RED = '\x1b[31m'
  const CYAN = '\x1b[36m'
  const DIM = '\x1b[2m'
  const BOLD = '\x1b[1m'
  const RESET = '\x1b[0m'

  if (!fs.existsSync(CONFIG_FILE)) {
    console.log(`${RED}✗ Not connected. Run "knowlinux connect" first.${RESET}`)
    return
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  let status: any = {}
  try { status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')) } catch (e) {}

  const connected = !!config.token
  const autoExecute = config.autoExecute === true
  const daemonRunning = !!status.pid
  const uptime = status.startedAt ? Math.floor((Date.now() - status.startedAt) / 1000) : 0
  const uptimeStr = uptime > 0
    ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`
    : '—'
  const lastPoll = status.lastPollAt
    ? Math.floor((Date.now() - new Date(status.lastPollAt).getTime()) / 1000) + 's ago'
    : '—'
  const daemonProcessExists = status.pid ? (() => { try { process.kill(status.pid, 0); return true } catch (e) { return false } })() : false

  const line = '─'.repeat(53)
  console.log('')
  console.log(`${CYAN}┌${line}┐${RESET}`)
  console.log(`${CYAN}│${RESET}  ${BOLD}🤖 KnowLinux Companion${RESET}                          ${CYAN}│${RESET}`)
  console.log(`${CYAN}├${line}┤${RESET}`)

  const row = (label: string, value: string) => {
    const padded = (label + ' ' + value).padEnd(51)
    console.log(`${CYAN}│${RESET}  ${padded}${CYAN}│${RESET}`)
  }

  row('Status:     ', connected ? `${GREEN}🟢 Connected${RESET}` : `${RED}🔴 Not connected${RESET}`)
  row('Daemon:     ', daemonProcessExists ? `${GREEN}🟢 Running (PID ${status.pid})${RESET}` : `${DIM}🔵 Not running${RESET}`)
  row('Mode:       ', autoExecute ? `${YELLOW}⚠️  Auto-execute ON${RESET}` : `${GREEN}🔒 Confirm mode${RESET}`)
  row('Uptime:     ', uptimeStr)
  row('Last poll:  ', lastPoll)
  row('Executed:   ', `${status.commandsExecuted || 0} commands`)
  console.log(`${CYAN}├${line}┤${RESET}`)
  console.log(`${CYAN}│${RESET}  ${BOLD}Quick Commands${RESET}                             ${CYAN}│${RESET}`)
  row('  Start:    ', `knowlinux-agent daemon`)
  row('  Toggle:   ', `knowlinux-agent toggle-auto`)
  row('  Stop:     ', `systemctl --user stop knowlinux-agent`)
  console.log(`${CYAN}└${line}┘${RESET}`)
  console.log('')
}


function watchStatus() {
  console.clear()
  console.log('\x1b[?25l') // hide cursor
  const loop = () => {
    // Move cursor to top
    process.stdout.write('\x1b[H')
    // Reprint the status
    const origLog = console.log
    console.log = (...args: any[]) => origLog(...args)
    showStatus()
    console.log('  \x1b[2mPress Ctrl+C to exit\x1b[0m')
  }
  loop()
  const interval = setInterval(loop, 2000)
  process.on('SIGINT', () => {
    clearInterval(interval)
    console.log('\x1b[?25h') // show cursor
    process.exit(0)
  })
}


const command = process.argv[2]
if (command === 'connect') {
  authenticate()
} else if (command === 'scan') {
  scanSystem()
} else if (command === 'daemon') {
  pollCommands()
} else if (command === 'toggle-auto') {
  toggleAuto()
} else if (command === 'status') {
  showStatus()
} else if (command === 'watch') {
  watchStatus()
} else {
  console.log(`
KnowLinux Companion Agent v1.1

Usage:
  knowlinux connect   - Authenticate this machine
  knowlinux scan      - Scan installed packages
  knowlinux daemon    - Listen for remote commands
  knowlinux toggle-auto - Enable/disable auto-execute
  knowlinux status    - Show agent status (one-shot)
  knowlinux watch     - Live-updating status dashboard
  `)
}
