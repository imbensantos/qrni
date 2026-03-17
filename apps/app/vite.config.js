import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const CONVEX_SITE_URL = process.env.VITE_CONVEX_URL?.replace('.cloud', '.site')

// Short codes: auto-generated (7-char alphanumeric) or custom slugs (letters, numbers, hyphens, underscores)
const SHORT_CODE_RE = /^\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,59}$/
const NAMESPACED_RE = /^\/[a-z][a-z0-9-]{0,29}\/[a-zA-Z0-9_-]{1,60}$/
// App routes that should never be treated as short links
const APP_ROUTES = new Set(['/profile'])

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'short-link-proxy',
      configureServer(server) {
        if (!CONVEX_SITE_URL) {
          console.warn('[short-link-proxy] VITE_CONVEX_URL is not set — short-link proxy disabled')
          return
        }
        server.middlewares.use(async (req, res, next) => {
          const path = req.url?.split('?')[0]
          if (path && !APP_ROUTES.has(path) && (SHORT_CODE_RE.test(path) || NAMESPACED_RE.test(path))) {
            try {
              const upstream = await fetch(`${CONVEX_SITE_URL}${path}`, { redirect: 'manual' })
              const location = upstream.headers.get('location')
              if (location && (upstream.status === 301 || upstream.status === 302)) {
                res.writeHead(upstream.status, { Location: location })
                res.end()
                return
              }
            } catch { /* fall through to SPA */ }
          }
          next()
        })
      },
    },
  ],
})
