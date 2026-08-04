import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * `base` must match the GitHub Pages sub-path.
 *
 * The site is served from https://<user>.github.io/Harrypotter/, so assets
 * resolve under /Harrypotter/ rather than /. Getting this wrong produces a
 * blank page with 404s on every asset, which is the single most common way a
 * Vite site fails on Pages.
 *
 * Overridable for other hosts: `BASE_PATH=/ npm run build` for a root deploy
 * (Netlify, Firebase, a custom domain).
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? '/Harrypotter/',
  plugins: [react()],
})
