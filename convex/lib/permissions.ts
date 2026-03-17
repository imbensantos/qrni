import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ERR } from "./constants";

export type Role = "owner" | "editor" | "viewer";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

export async function checkPermission(
  ctx: QueryCtx,
  namespaceId: Id<"namespaces">,
  userId: Id<"users">,
  requiredRole: Role,
): Promise<{ role: Role; isOwner: boolean }> {
  const namespace = await ctx.db.get(namespaceId);
  if (!namespace) throw new Error(ERR.NOT_AUTHORIZED);

  if (namespace.owner === userId) {
    return { role: "owner", isOwner: true };
  }

  const membership = await ctx.db
    .query("namespace_members")
    .withIndex("by_namespace_user", (q) => q.eq("namespace", namespaceId).eq("user", userId))
    .first();

  if (!membership) throw new Error(ERR.NOT_AUTHORIZED);

  const userRole: Role = membership.role as Role;
  if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[requiredRole]) {
    throw new Error(ERR.NOT_AUTHORIZED);
  }

  return { role: userRole, isOwner: false };
}
