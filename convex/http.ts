import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { checkUrlSafety } from "./safeBrowsing";
import { ERR } from "./lib/constants";
import { buildBotHtml } from "./lib/ogScraper";

// Facebook/Meta bots are excluded — they follow 302 redirects natively and
// flag cross-domain OG tags as phishing. Their UA often includes "Twitterbot"
// so we must check for Facebook FIRST before matching other bots.
const FACEBOOK_UA_PATTERNS = ["facebookexternalhit", "facebot", "meta-externalagent"];

const BOT_USER_AGENTS = [
  "Slackbot",
  "Twitterbot",
  "LinkedInBot",
  "Discordbot",
  "WhatsApp",
  "Applebot",
  "TelegramBot",
  "Googlebot",
  "bingbot",
  "Pinterestbot",
  "Embedly",
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  // Let Facebook/Meta bots through — they follow redirects to the destination
  if (FACEBOOK_UA_PATTERNS.some((fb) => ua.includes(fb))) return false;
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

const http = httpRouter();

// Auth routes (OAuth signin/callback, OIDC discovery)
auth.addHttpRoutes(http);

// Anonymous link creation via HTTP so the real client IP can be extracted from
// request headers rather than trusting a client-supplied identifier.
// POST /api/links/anonymous  body: { destinationUrl: string }
http.route({
  path: "/api/links/anonymous",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: { destinationUrl?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.destinationUrl || typeof body.destinationUrl !== "string") {
      return new Response(JSON.stringify({ error: "destinationUrl is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract real client IP from standard proxy headers.
    // Security note: In production behind Vercel/Convex, X-Forwarded-For is set
    // by the platform's reverse proxy and cannot be spoofed by end users — the
    // platform overwrites or appends to the header at the edge. This is safe as
    // long as the Convex HTTP endpoint is not exposed directly to the internet
    // without a trusted proxy in front.
    const creatorIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "";

    if (!creatorIp) {
      return new Response(JSON.stringify({ error: "Unable to determine client IP" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Check URL safety before creating the link
      const safetyResult = await checkUrlSafety(body.destinationUrl);
      if (!safetyResult.safe) {
        return new Response(
          JSON.stringify({
            error: "This URL was flagged as potentially harmful and can't be shortened.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const result = await ctx.runMutation(internal.links.createAnonymousLinkInternal, {
        destinationUrl: body.destinationUrl,
        creatorIp,
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal server error";
      const safeMessages: string[] = [
        ERR.ANONYMOUS_RATE_LIMITED,
        ERR.INVALID_URL,
        ERR.URL_TOO_LONG,
        ERR.UNSAFE_URL,
      ];
      const safeMessage = safeMessages.includes(message) ? message : "Something went wrong";
      return new Response(JSON.stringify({ error: safeMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Short link redirects: /{code} or /{namespace}/{slug}
// Must skip paths reserved for auth (/.well-known/, /api/auth/)
http.route({
  pathPrefix: "/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Let auth routes pass through (this handler should not be reached for
    // auth paths if Convex resolves specific prefixes first, but guard anyway)
    if (path.startsWith("/api/auth/") || path.startsWith("/.well-known/")) {
      return new Response("Not found", { status: 404 });
    }

    const trimmed = path.replace(/^\//, "");

    if (!trimmed) {
      return new Response(null, { status: 302, headers: { Location: "/" } });
    }

    const parts = trimmed.split("/").filter(Boolean);
    let link;

    if (parts.length >= 2) {
      const [namespaceSlug, slug] = parts;
      const namespace = await ctx.runQuery(internal.redirects.getNamespaceBySlug, {
        slug: namespaceSlug,
      });
      if (namespace) {
        link = await ctx.runQuery(internal.redirects.getNamespacedLink, {
          namespaceId: namespace._id,
          slug,
        });
      }
    }

    if (!link && parts.length === 1) {
      link = await ctx.runQuery(internal.redirects.getLinkByCode, {
        shortCode: parts[0],
      });
    }

    if (!link) {
      return new Response("Not Found", { status: 404 });
    }

    // Security: re-validate protocol before redirecting to prevent open redirect
    // attacks if a stored URL was somehow modified or inserted without validation.
    if (!link.destinationUrl.startsWith("http://") && !link.destinationUrl.startsWith("https://")) {
      return new Response("Invalid redirect target", { status: 400 });
    }

    // Bot detection: serve OG meta tags for link preview crawlers
    const userAgent = request.headers.get("user-agent");
    if (isBot(userAgent)) {
      let ogTitle = link.ogTitle ?? "";
      let ogDescription = link.ogDescription ?? "";
      let ogImage = link.ogImage ?? "";
      let ogSiteName = link.ogSiteName ?? "";

      // Lazy fetch: if OG data hasn't been fetched yet, fetch it now
      if (link.ogFetchedAt === undefined) {
        try {
          const result = await ctx.runAction(internal.ogScraper.fetchAndCacheOgData, {
            linkId: link._id,
            destinationUrl: link.destinationUrl,
          });
          ogTitle = result.ogTitle;
          ogDescription = result.ogDescription;
          ogImage = result.ogImage;
          ogSiteName = result.ogSiteName;
        } catch {
          // If fetch fails, serve fallback HTML with URL as title
        }
      }

      await ctx.runMutation(internal.redirects.incrementClickCount, {
        linkId: link._id,
      });

      const html = buildBotHtml({
        destinationUrl: link.destinationUrl,
        ogTitle,
        ogDescription,
        ogImage,
        ogSiteName,
      });

      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Regular user: 302 redirect (existing behavior)
    await ctx.runMutation(internal.redirects.incrementClickCount, {
      linkId: link._id,
    });

    return new Response(null, {
      status: 302,
      headers: { Location: link.destinationUrl },
    });
  }),
});

export default http;
