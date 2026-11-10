#!/usr/bin/env bun
import os from 'os'
import fs from 'fs'
import path from 'path'

const API_URL = 'https://knowlinux.tech/api/companion'
const CONFIG_DIR = path.join(os.homedir(), '.knowlinux')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

async function authenticate() {
  console.log('🔗 Connecting to KnowLinux...')
  
  // 1. Get device code
  const res = await fetch(`${API_URL}/device-code`, { method: 'POST' })
  const data = await res.json()

  console.log(`\n=========================================`)
  console.log(`Please go to: ${data.verificationUri}`)
  console.log(`And enter the code: ${data.code}`)
  console.log(`=========================================\n`)
  console.log(`Waiting for authorization...`)

  // 2. Poll for token
  while (true) {
    await new Promise(r => setTimeout(r, 3000)) // Poll every 3s
    
    const pollRes = await fetch(`${API_URL}/token?deviceCode=${data.deviceCode}`)
    const pollData = await pollRes.json()

    if (pollRes.ok) {
      // Save token
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
    console.error('❌ Not connected. Please run "knowlinux-agent connect" first.')
    return
  }

  const { token } = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  
  // Gather system info
  const osRelease = fs.readFileSync('/etc/os-release', 'utf8')
  const distro = osRelease.match(/PRETTY_NAME="(.+)"/)?.[1] || 'Unknown Linux'
  
  console.log(`Detected: ${distro} (${os.arch()})`)
  console.log(`Kernel: ${os.release()}`)
  console.log(`Hostname: ${os.hostname()}`)
  
  // Send to backend
  const res = await fetch(`${API_URL}/sync`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      distro,
      arch: os.arch(),
      kernel: os.release(),
      hostname: os.hostname()
    })
  })

  if (res.ok) {
    console.log('✅ System scan uploaded to KnowLinux!')
  } else {
    console.error('❌ Failed to upload scan results.')
  }
}

const command = process.argv[2]

if (command === 'connect') {
  authenticate()
} else if (command === 'scan') {
  scanSystem()
} else {
  console.log(`
KnowLinux Companion Agent v1.0

Usage:
  knowlinux connect   - Authenticate this machine with knowlinux.tech
  knowlinux scan      - Scan local system and sync with KnowLinux
  `)
}
