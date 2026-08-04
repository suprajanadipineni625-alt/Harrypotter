/**
 * Renders the 9:16 cut.
 *
 * Remotion normally downloads its own headless Chromium. Where network egress
 * is restricted — CI, sandboxes, this container — that download 403s, so we
 * fall back to a locally installed headless shell if one is present.
 *
 * Note it must be the HEADLESS SHELL, not the full Chrome binary: modern Chrome
 * removed old headless mode, and Remotion needs it.
 *
 *   npm run reel:render
 *   REEL_ID=reel-16x9 npm run reel:render
 *   REEL_FRAMES=1560-1620 npm run reel:render      # a single movement
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const LOCAL_SHELLS = [
  process.env.REMOTION_BROWSER,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
].filter(Boolean)

const shell = LOCAL_SHELLS.find((p) => existsSync(p))
const id = process.env.REEL_ID ?? 'reel-9x16'
const out = process.env.REEL_OUT ?? `out/${id}.mp4`

const args = ['remotion', 'render', 'remotion/index.ts', id, out]
if (shell) {
  args.push(`--browser-executable=${shell}`)
  console.log(`using local headless shell: ${shell}`)
}
if (process.env.REEL_FRAMES) args.push(`--frames=${process.env.REEL_FRAMES}`)
if (process.env.REEL_GL) args.push(`--gl=${process.env.REEL_GL}`)
if (process.env.REEL_CONCURRENCY) args.push(`--concurrency=${process.env.REEL_CONCURRENCY}`)

const r = spawnSync('npx', args, { stdio: 'inherit' })
process.exit(r.status ?? 1)
