import { action } from "./_generated/server";
import { v } from "convex/values";

export async function checkUrlSafety(url: string): Promise<{ safe: boolean; unchecked?: boolean }> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    // In development, allow URLs through unchecked but warn loudly.
    // In production, refuse to silently skip safety checks — this prevents
    // a misconfigured deployment from becoming an open redirect to malware.
    const isDev = process.env.CONVEX_IS_DEV === "true";
    if (isDev) {
      console.warn(
        "GOOGLE_SAFE_BROWSING_API_KEY is not set — URL threat checking is disabled in dev mode. " +
          "Configure the env var in the Convex dashboard to enable it.",
      );
      return { safe: true, unchecked: true };
    }
    throw new Error(
      "URL safety checking is unavailable. GOOGLE_SAFE_BROWSING_API_KEY must be configured.",
    );
  }

  const response = await fetch(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "qrni", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
    },
  );

  const data = await response.json();
  return { safe: !data.matches || data.matches.length === 0 };
}

export const checkUrl = action({
  args: { url: v.string() },
  handler: async (_ctx, args) => {
    return checkUrlSafety(args.url);
  },
});
