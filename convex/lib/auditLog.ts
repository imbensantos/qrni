import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const AUDIT_ACTIONS = [
  "link.create",
  "link.delete",
  "link.update",
  "namespace.create",
  "namespace.update",
  "namespace.delete",
  "namespace.transfer",
  "member.invite",
  "member.join",
  "member.leave",
  "member.remove",
  "invite.revoke",
  "user.update",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export async function logAudit(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    action: AuditAction;
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
