import { internalMutation } from "./_generated/server";
import { AUDIT_LOG_RETENTION_MS, RATE_LIMIT_WINDOW_MS } from "./lib/constants";

/** Delete audit_log entries older than 90 days, in batches of 100. */
export const pruneAuditLog = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - AUDIT_LOG_RETENTION_MS;
    const expired = await ctx.db
      .query("audit_log")
      .withIndex("by_action_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .take(100);
    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }
  },
});

/** Delete rate_limit records with expired windows, in batches of 100. */
export const pruneRateLimits = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    const expired = await ctx.db
      .query("rate_limits")
      .withIndex("by_window_start")
      .filter((q) => q.lt(q.field("windowStart"), cutoff))
      .take(100);
    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }
  },
});
