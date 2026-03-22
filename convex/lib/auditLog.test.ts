import { describe, it, expect } from "vitest";
import { logAudit, AUDIT_ACTIONS } from "./auditLog";
import { createMockCtx } from "./testHelpers.test-utils";

describe("logAudit", () => {
  it("inserts an audit log entry with all required fields", async () => {
    const ctx = createMockCtx();
    const userId = "user123" as any;

    await logAudit(ctx as any, {
      userId,
      action: "link.create",
      resourceType: "link",
      resourceId: "link456",
    });

    expect(ctx.db.insert).toHaveBeenCalledOnce();
    expect(ctx.db.insert).toHaveBeenCalledWith("audit_log", {
      userId,
      action: "link.create",
      resourceType: "link",
      resourceId: "link456",
      metadata: undefined,
      timestamp: expect.any(Number),
    });
  });

  it("includes metadata when provided", async () => {
    const ctx = createMockCtx();
    const userId = "user123" as any;

    await logAudit(ctx as any, {
      userId,
      action: "namespace.update",
      resourceType: "namespace",
      resourceId: "ns789",
      metadata: { updates: { slug: "new-slug" } },
    });

    expect(ctx.db.insert).toHaveBeenCalledWith("audit_log", {
      userId,
      action: "namespace.update",
      resourceType: "namespace",
      resourceId: "ns789",
      metadata: { updates: { slug: "new-slug" } },
      timestamp: expect.any(Number),
    });
  });

  it("uses current timestamp", async () => {
    const ctx = createMockCtx();
    const before = Date.now();

    await logAudit(ctx as any, {
      userId: "user123" as any,
      action: "user.update",
      resourceType: "user",
      resourceId: "user123",
    });

    const after = Date.now();
    const callArgs = (ctx.db.insert as any).mock.calls[0][1];
    expect(callArgs.timestamp).toBeGreaterThanOrEqual(before);
    expect(callArgs.timestamp).toBeLessThanOrEqual(after);
  });

  it("does not include extra fields beyond the schema", async () => {
    const ctx = createMockCtx();

    await logAudit(ctx as any, {
      userId: "user123" as any,
      action: "member.join",
      resourceType: "member",
      resourceId: "member456",
      metadata: { namespace: "ns789", role: "editor" },
    });

    const callArgs = (ctx.db.insert as any).mock.calls[0][1];
    const keys = Object.keys(callArgs).sort();
    expect(keys).toEqual([
      "action",
      "metadata",
      "resourceId",
      "resourceType",
      "timestamp",
      "userId",
    ]);
  });
});

// ---------------------------------------------------------------------------
// S1. Audit action type safety
//
// WHY THIS FAILS against current code:
//   auditLog.ts accepts `action: string` — any arbitrary string is valid.
//   There is no AUDIT_ACTIONS constant exported, and no union type that
//   constrains the action parameter to the known set of actions actually used
//   across the codebase. The import of AUDIT_ACTIONS above will cause a
//   compile/runtime error because it does not exist yet.
//
// The known set of actions in use (found by searching all logAudit call sites):
//   links.ts:     "link.create", "link.delete", "link.update"
//   namespaces.ts: "namespace.create", "namespace.update", "namespace.delete",
//                  "namespace.transfer"
//   collaboration.ts: "member.invite", "member.join", "member.leave",
//                     "member.remove", "invite.revoke"
//   users.ts:     "user.update"
//
// After the fix, AUDIT_ACTIONS should be exported as a const array (or object)
// containing these strings, and the action parameter should be typed against it.
// ---------------------------------------------------------------------------
describe("AUDIT_ACTIONS — S1: action type safety", () => {
  it("exports AUDIT_ACTIONS as a defined value", () => {
    // FAILS: AUDIT_ACTIONS is not exported from auditLog.ts
    expect(AUDIT_ACTIONS).toBeDefined();
  });

  it("AUDIT_ACTIONS is an array or object containing known action strings", () => {
    // FAILS: AUDIT_ACTIONS does not exist
    const actions = Array.isArray(AUDIT_ACTIONS) ? AUDIT_ACTIONS : Object.values(AUDIT_ACTIONS);
    expect(actions.length).toBeGreaterThan(0);
    // Every element must be a non-empty string
    for (const action of actions) {
      expect(typeof action).toBe("string");
      expect((action as string).length).toBeGreaterThan(0);
    }
  });

  it("AUDIT_ACTIONS contains all link-related actions used in the codebase", () => {
    // FAILS: AUDIT_ACTIONS does not exist
    const actions = Array.isArray(AUDIT_ACTIONS) ? AUDIT_ACTIONS : Object.values(AUDIT_ACTIONS);
    expect(actions).toContain("link.create");
    expect(actions).toContain("link.delete");
    expect(actions).toContain("link.update");
  });

  it("AUDIT_ACTIONS contains all namespace-related actions used in the codebase", () => {
    // FAILS: AUDIT_ACTIONS does not exist
    const actions = Array.isArray(AUDIT_ACTIONS) ? AUDIT_ACTIONS : Object.values(AUDIT_ACTIONS);
    expect(actions).toContain("namespace.create");
    expect(actions).toContain("namespace.update");
    expect(actions).toContain("namespace.delete");
    expect(actions).toContain("namespace.transfer");
  });

  it("AUDIT_ACTIONS contains all member and invite actions used in the codebase", () => {
    // FAILS: AUDIT_ACTIONS does not exist
    const actions = Array.isArray(AUDIT_ACTIONS) ? AUDIT_ACTIONS : Object.values(AUDIT_ACTIONS);
    expect(actions).toContain("member.invite");
    expect(actions).toContain("member.join");
    expect(actions).toContain("member.leave");
    expect(actions).toContain("member.remove");
    expect(actions).toContain("invite.revoke");
  });

  it("AUDIT_ACTIONS contains the user.update action used in the codebase", () => {
    // FAILS: AUDIT_ACTIONS does not exist
    const actions = Array.isArray(AUDIT_ACTIONS) ? AUDIT_ACTIONS : Object.values(AUDIT_ACTIONS);
    expect(actions).toContain("user.update");
  });

  it("AUDIT_ACTIONS contains no duplicate entries", () => {
    // FAILS: AUDIT_ACTIONS does not exist
    const actions = Array.isArray(AUDIT_ACTIONS) ? AUDIT_ACTIONS : Object.values(AUDIT_ACTIONS);
    const uniqueActions = new Set(actions);
    expect(uniqueActions.size).toBe(actions.length);
  });
});
