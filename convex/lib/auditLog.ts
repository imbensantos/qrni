import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function logAudit(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  },
) {
  await ctx.db.insert("audit_log", {
    userId: args.userId,
    action: args.action,
    resourceType: args.resourceType,
    resourceId: args.resourceId,
    metadata: args.metadata,
    timestamp: Date.now(),
  });
}
