// Test the game on a phone: starts the dev server and, if cloudflared is installed, an https tunnel to it.
// WebGPU only runs on https or localhost, so the phone cannot open the plain network address of the dev
// server; the tunnel gives it a temporary https address (gone when you stop this script). Anyone who has
// that address can open it, so do not share it.
//
//   npm run phone
//
// One-time setup: brew install cloudflared
import { spawn, spawnSync } from 'node:child_process'

const PORT = 5173
const children = []
const stop = () => children.forEach((child) => child.kill())
process.on('SIGINT', () => {
  stop()
  process.exit(0)
})
process.on('exit', stop)

children.push(spawn('npx', ['vite', '--host', '--port', String(PORT), '--strictPort'], { stdio: 'inherit' }))

if (spawnSync('which', ['cloudflared']).status !== 0) {
  console.log('\n[phone] cloudflared is not installed, so there is no https address for the phone.')
  console.log('[phone] Install it once with:  brew install cloudflared   and run  npm run phone  again.\n')
} else {
  const tunnel = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(tunnel)
  let shown = false
  const look = (data) => {
    const found = !shown && String(data).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
    if (!found) return
    shown = true
    console.log(`\n[phone] Open this on your phone:  ${found[0]}\n`)
  }
  tunnel.stdout.on('data', look)
  tunnel.stderr.on('data', look) // (cloudflared prints its address on stderr)
}
