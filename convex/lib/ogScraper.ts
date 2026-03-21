export interface OgData {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogSiteName: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
};

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39|#x27|#x2F);/g, (entity) => {
    return HTML_ENTITY_MAP[entity] ?? entity;
  });
}

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtmlAttr(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// parseOgTags
// ---------------------------------------------------------------------------

type OgKey = "og:title" | "og:description" | "og:image" | "og:site_name";

const OG_KEY_TO_FIELD: Record<OgKey, keyof OgData> = {
  "og:title": "ogTitle",
  "og:description": "ogDescription",
  "og:image": "ogImage",
  "og:site_name": "ogSiteName",
};

/**
 * Extracts a meta tag's og key and content value from a raw <meta ...> tag
 * string. Handles both attribute orders and single/double quotes.
 */
function extractMetaTag(tag: string): { key: string; content: string } | null {
  const attrPattern = `(?:property|name)\\s*=\\s*(["'])(og:[^"']+)\\1`;
  const contentPattern = `content\\s*=\\s*(["'])([^"']*)\\1`;

  // Allow attributes to appear in either order by trying both arrangements.
  const keyFirstRe = new RegExp(`${attrPattern}[^>]*${contentPattern}`, "i");
  const contentFirstRe = new RegExp(`${contentPattern}[^>]*${attrPattern}`, "i");

  const keyFirst = keyFirstRe.exec(tag);
  if (keyFirst) {
    return { key: keyFirst[2], content: keyFirst[4] };
  }

  const contentFirst = contentFirstRe.exec(tag);
  if (contentFirst) {
    return { key: contentFirst[4], content: contentFirst[2] };
  }

  return null;
}

export function parseOgTags(html: string): OgData {
  const result: OgData = {
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogSiteName: "",
  };

  // Match every <meta ... > tag (self-closing or not)
  const metaTagRe = /<meta\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = metaTagRe.exec(html)) !== null) {
    const tag = match[0];
    const extracted = extractMetaTag(tag);
    if (!extracted) continue;

    const field = OG_KEY_TO_FIELD[extracted.key as OgKey];
    if (field && result[field] === "") {
      result[field] = decodeHtmlEntities(extracted.content);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// buildBotHtml
// ---------------------------------------------------------------------------

export function buildBotHtml(opts: OgData & { destinationUrl: string }): string {
  const { destinationUrl, ogDescription, ogImage } = opts;

  const title = opts.ogTitle || destinationUrl;
  const siteName = opts.ogSiteName || extractDomain(destinationUrl);

  const descriptionTag = ogDescription
    ? `  <meta property="og:description" content="${escapeHtmlAttr(ogDescription)}" />\n`
    : "";

  const imageTag = ogImage
    ? `  <meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />\n`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0;url=${escapeHtmlAttr(destinationUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtmlAttr(destinationUrl)}" />
  <meta property="og:title" content="${escapeHtmlAttr(title)}" />
  <meta property="og:site_name" content="${escapeHtmlAttr(siteName)}" />
${descriptionTag}${imageTag}</head>
<body></body>
</html>
`;
}
