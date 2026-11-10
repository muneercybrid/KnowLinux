#!/usr/bin/env bun
import os from 'os'
import fs from 'fs'
import path from 'path'

const API_URL = 'https://knowlinux.tech/api/companion'
const CONFIG_DIR = path.join(os.homedir(), '.knowlinux')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

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
  console.log('🔍 Scanning your Linux system...')
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('❌ Not connected. Please run "knowlinux connect" first.')
    return
  }

  const { token } = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  const osRelease = fs.existsSync('/etc/os-release') ? fs.readFileSync('/etc/os-release', 'utf8') : ''
  const distro = osRelease.match(/PRETTY_NAME="(.+)"/)?.[1] || 'Unknown Linux'

  console.log(`   Distro: ${distro}`)
  console.log(`   Kernel: ${os.release()}`)
  console.log(`   Arch: ${os.arch()}`)
  console.log(`   Hostname: ${os.hostname()}`)

  // Get installed packages via dpkg
  console.log('📦 Reading installed packages...')
  let packages: { name: string; version: string; description: string }[] = []

  try {
    const proc = Bun.spawn(['dpkg-query', '-W', '-f', '${Package}|${Version}|${binary:Summary}\n'], {
      stdout: 'pipe',
    })
    const output = await new Response(proc.stdout).text()
    
    // Robust parser: only accept lines that look like "pkgname|version|summary"
    packages = output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split('|')
        if (parts.length < 3) return null
        const [name, version, description] = parts
        // Validate package name format
        if (!/^[a-z0-9][a-z0-9.+-]*$/i.test(name.trim())) return null
        return {
          name: name.trim(),
          version: version.trim(),
          description: description.trim()
        }
      })
      .filter((p): p is { name: string; version: string; description: string } => p !== null)

    console.log(`   Found ${packages.length} installed packages`)
  } catch (e) {
    console.log('   ⚠️  Could not read packages via dpkg (non-Debian system?)')
  }

  // Upload to backend
  console.log('☁️  Uploading to KnowLinux...')
  const res = await fetch(`${API_URL}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      distro,
      kernel: os.release(),
      hostname: os.hostname(),
      arch: os.arch(),
      packages
    })
  })

  if (res.ok) {
    const data = await res.json()
    console.log(`✅ Scan complete! Uploaded ${data.packagesCount} packages.`)
  } else {
    console.error('❌ Upload failed:', await res.text())
  }
}



async function pollCommands() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('❌ Not connected. Run "knowlinux connect" first.')
    return
  }
  const { token } = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  console.log('👂 Listening for commands from KnowLinux... (Ctrl+C to stop)')

  while (true) {
    try {
      const res = await fetch(`${API_URL}/pending-commands`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const commands: any[] = await res.json()
        for (const cmd of commands) {
          console.log(`\n🔔 Command received: ${cmd.command}`)
          console.log('⚠️  Review carefully. Type "y" to execute, anything else to skip:')
          const answer = prompt('> ') || ''
          if (answer.toLowerCase() === 'y') {
            console.log('⏳ Executing...')
            const proc = Bun.spawn(['bash', '-c', cmd.command], {
              stdout: 'pipe', stderr: 'pipe'
            })
            const stdout = await new Response(proc.stdout).text()
            const stderr = await new Response(proc.stderr).text()
            const exitCode = await proc.exited
            
            const fullOutput = stdout + (stderr ? '\n[stderr]\n' + stderr : '')
            console.log(`✅ Exit code: ${exitCode}`)
            console.log(fullOutput)

            await fetch(`${API_URL}/commands/${cmd.id}/result`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ output: fullOutput, exitCode })
            })
          } else {
            await fetch(`${API_URL}/commands/${cmd.id}/result`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ output: 'Command rejected by user.', exitCode: -1 })
            })
          }
        }
      }
    } catch (e) {
      // Silent error, retry in 5s
    }
    await new Promise(r => setTimeout(r, 5000))
  }
}

const command = process.argv[2]
if (command === 'connect') {
  authenticate()
} else if (command === 'scan') {
  scanSystem()
} else if (command === 'daemon') {
  pollCommands()
} else {
  console.log(`
KnowLinux Companion Agent v1.1

Usage:
  knowlinux connect   - Authenticate this machine
  knowlinux scan      - Scan installed packages
  knowlinux daemon    - Listen for remote commands
  `)
}
