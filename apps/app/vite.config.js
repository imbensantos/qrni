import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Short codes: auto-generated (7-char alphanumeric) or custom slugs (letters, numbers, hyphens, underscores)
const SHORT_CODE_RE = /^\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,59}$/;
const NAMESPACED_RE = /^\/[a-z][a-z0-9-]{0,29}\/[a-zA-Z0-9_-]{1,60}$/;
// App routes that should never be treated as short links
const APP_ROUTES = new Set(["/profile", "/privacy", "/about", "/contact"]);
const APP_ROUTE_PREFIXES = ["/invite/"];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), "");
  const CONVEX_SITE_URL = env.VITE_CONVEX_URL?.replace(".cloud", ".site");

  return {
    plugins: [
      react(),
      {
        name: "security-headers",
        configureServer(server) {
          server.middlewares.use((_req, res, next) => {
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-Frame-Options", "DENY");
            res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
            res.setHeader(
              "Content-Security-Policy",
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagservices.com https://adservice.google.com; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' ws: wss: https://*.convex.cloud wss://*.convex.cloud https://pagead2.googlesyndication.com; img-src 'self' https: data: blob:; frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; frame-ancestors 'none'; object-src 'none'",
            );
            next();
          });
        },
      },
      {
        name: "short-link-proxy",
        configureServer(server) {
          if (!CONVEX_SITE_URL) {
            console.warn(
              "[short-link-proxy] VITE_CONVEX_URL is not set — short-link proxy disabled",
            );
            return;
          }
          server.middlewares.use(async (req, res, next) => {
            const path = req.url?.split("?")[0];
            if (
              path &&
              !APP_ROUTES.has(path) &&
              !APP_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix)) &&
              (SHORT_CODE_RE.test(path) || NAMESPACED_RE.test(path))
            ) {
              try {
                const upstream = await fetch(`${CONVEX_SITE_URL}${path}`, {
                  redirect: "manual",
                });
                const location = upstream.headers.get("location");
                if (location && (upstream.status === 301 || upstream.status === 302)) {
                  res.writeHead(upstream.status, { Location: location });
                  res.end();
                  return;
                }
              } catch {
                /* fall through to SPA */
              }
            }
            next();
          });
        },
      },
    ],
    build: {
      sourcemap: false,
    },
  };
});
