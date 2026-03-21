import { describe, it, expect } from "vitest";
import { logAudit } from "./auditLog";
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
