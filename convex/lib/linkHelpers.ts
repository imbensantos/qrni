import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { generateShortCode } from "./shortCode";
import {
  DUPLICATE_WINDOW_MS,
  MAX_SHORT_CODE_ATTEMPTS,
  ERR,
  ANONYMOUS_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
} from "./constants";

/**
 * Checks for a duplicate link submission within the dedup window.
 *
 * For anonymous links, checks by creator IP.
 * For authenticated links, checks by owner.
 *
 * Returns the existing link's shortCode and ID if a duplicate is found,
 * or null if no duplicate exists.
 */
export async function checkDuplicateSubmission(
  ctx: MutationCtx,
  opts:
    | { kind: "anonymous"; creatorIp: string; destinationUrl: string }
    | {
        kind: "authenticated";
        ownerId: Id<"users">;
        destinationUrl: string;
        shortCode?: string;
      }
    | {
        kind: "namespaced";
        namespaceId: Id<"namespaces">;
        slug: string;
        destinationUrl: string;
      },
): Promise<{ shortCode: string; linkId: Id<"links"> } | null> {
  if (opts.kind === "anonymous") {
    const recent = await ctx.db
      .query("links")
      .withIndex("by_creator_ip", (q) => q.eq("creatorIp", opts.creatorIp))
      .order("desc")
      .first();
    if (
      recent &&
      recent.destinationUrl === opts.destinationUrl &&
      Date.now() - recent.createdAt < DUPLICATE_WINDOW_MS
    ) {
      return { shortCode: recent.shortCode, linkId: recent._id };
    }
    return null;
  }

  if (opts.kind === "authenticated") {
    const recent = await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", opts.ownerId))
      .order("desc")
      .first();
    if (
      recent &&
      recent.destinationUrl === opts.destinationUrl &&
      (!opts.shortCode || recent.shortCode === opts.shortCode) &&
      Date.now() - recent.createdAt < DUPLICATE_WINDOW_MS
    ) {
      return { shortCode: recent.shortCode, linkId: recent._id };
    }
    return null;
  }

  // namespaced
  const existing = await ctx.db
    .query("links")
    .withIndex("by_namespace_slug", (q) =>
      q.eq("namespace", opts.namespaceId).eq("namespaceSlug", opts.slug),
    )
    .first();
  if (
    existing &&
    existing.destinationUrl === opts.destinationUrl &&
    Date.now() - existing.createdAt < DUPLICATE_WINDOW_MS
  ) {
    return { shortCode: existing.shortCode, linkId: existing._id };
  }
  return null;
}

/**
 * Generates a unique short code that doesn't collide with existing links.
 * Retries up to MAX_SHORT_CODE_ATTEMPTS times.
 */
export async function generateUniqueShortCode(ctx: MutationCtx): Promise<string> {
  let attempts = 0;
  while (attempts < MAX_SHORT_CODE_ATTEMPTS) {
    const shortCode = generateShortCode();
    const existing = await ctx.db
      .query("links")
      .withIndex("by_short_code", (q) => q.eq("shortCode", shortCode))
      .first();
    if (!existing) return shortCode;
    attempts++;
  }
  throw new Error(ERR.SHORT_CODE_EXHAUSTED);
}

/**
 * Generates a unique namespace-scoped slug that doesn't collide with
 * existing links in the given namespace.
 */
export async function generateUniqueNamespaceSlug(
  ctx: MutationCtx,
  namespaceId: Id<"namespaces">,
): Promise<string> {
  let attempts = 0;
  while (attempts < MAX_SHORT_CODE_ATTEMPTS) {
    const slug = generateShortCode();
    const existing = await ctx.db
      .query("links")
      .withIndex("by_namespace_slug", (q) =>
        q.eq("namespace", namespaceId).eq("namespaceSlug", slug),
      )
      .first();
    if (!existing) return slug;
    attempts++;
  }
  throw new Error(ERR.SHORT_CODE_EXHAUSTED);
}

/**
 * Checks and updates the rate limit for anonymous link creation (by IP).
 * Also cleans up expired rate limit records for the given IP.
 */
export async function checkAnonymousRateLimit(ctx: MutationCtx, ip: string): Promise<void> {
  const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;

  const rateLimit = await ctx.db
    .query("rate_limits")
    .withIndex("by_ip", (q) => q.eq("ip", ip))
    .first();

  if (rateLimit) {
    if (rateLimit.windowStart > windowStart && rateLimit.count >= ANONYMOUS_RATE_LIMIT) {
      throw new Error(ERR.ANONYMOUS_RATE_LIMITED);
    }
    if (rateLimit.windowStart <= windowStart) {
      // Window expired — reset
      await ctx.db.patch(rateLimit._id, {
        windowStart: Date.now(),
        count: 1,
      });
    } else {
      await ctx.db.patch(rateLimit._id, { count: rateLimit.count + 1 });
    }
  } else {
    await ctx.db.insert("rate_limits", {
      ip,
      windowStart: Date.now(),
      count: 1,
    });
  }

  // Issue #8: Clean up expired rate limit records for other IPs
  // We do a small batch cleanup each time to avoid unbounded growth.
  // Only delete records whose window has fully expired.
  const expiredRecords = await ctx.db
    .query("rate_limits")
    .filter((q) => q.lt(q.field("windowStart"), windowStart))
    .take(10);
  for (const record of expiredRecords) {
    await ctx.db.delete(record._id);
  }
}

/**
 * Checks and updates the rate limit for authenticated link creation (by user ID).
 * Uses the rate_limits table with a "user:" prefixed key to distinguish from IP-based limits.
 * Also cleans up expired rate limit records.
 */
export async function checkAuthRateLimit(ctx: MutationCtx, userId: Id<"users">): Promise<void> {
  const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
  const key = `user:${userId}`;

  const rateLimit = await ctx.db
    .query("rate_limits")
    .withIndex("by_ip", (q) => q.eq("ip", key))
    .first();

  if (rateLimit) {
    if (rateLimit.windowStart > windowStart && rateLimit.count >= AUTH_RATE_LIMIT) {
      throw new Error(ERR.AUTH_RATE_LIMITED);
    }
    if (rateLimit.windowStart <= windowStart) {
      await ctx.db.patch(rateLimit._id, {
        windowStart: Date.now(),
        count: 1,
      });
    } else {
      await ctx.db.patch(rateLimit._id, { count: rateLimit.count + 1 });
    }
  } else {
    await ctx.db.insert("rate_limits", {
      ip: key,
      windowStart: Date.now(),
      count: 1,
    });
  }
}
