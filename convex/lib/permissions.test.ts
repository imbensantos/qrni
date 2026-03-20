import { describe, it, expect, vi } from "vitest";
import { checkPermission } from "./permissions";
import { ERR } from "./constants";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------
const NAMESPACE_ID = "namespaces:ns001" as never;
const OWNER_ID = "users:owner01" as never;
const EDITOR_ID = "users:editor01" as never;
const VIEWER_ID = "users:viewer01" as never;
const STRANGER_ID = "users:stranger" as never;

function createMockCtx(opts: {
  namespace?: { _id: typeof NAMESPACE_ID; owner: string } | null;
  membership?: { role: string } | null;
}) {
  return {
    db: {
      get: vi.fn().mockResolvedValue(opts.namespace ?? null),
      query: vi.fn().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(opts.membership ?? null),
        }),
      }),
    },
  };
}

// ---------------------------------------------------------------------------
// Permission error messages — must be generic to prevent enumeration
// ---------------------------------------------------------------------------
describe("permission error messages", () => {
  it("should use a generic NOT_AUTHORIZED message", () => {
    expect(ERR.NOT_AUTHORIZED).toBe("Not authorized");
    expect(ERR.NOT_AUTHORIZED.toLowerCase()).not.toContain("namespace");
    expect(ERR.NOT_AUTHORIZED.toLowerCase()).not.toContain("member");
    expect(ERR.NOT_AUTHORIZED.toLowerCase()).not.toContain("role");
  });
});

// ---------------------------------------------------------------------------
// checkPermission
// ---------------------------------------------------------------------------
describe("checkPermission", () => {
  it("grants owner role when user owns the namespace", async () => {
    const ctx = createMockCtx({
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
    });

    const result = await checkPermission(ctx as never, NAMESPACE_ID, OWNER_ID, "viewer");
    expect(result).toEqual({
      role: "owner",
      isOwner: true,
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
    });
  });

  it("grants owner access for any required role", async () => {
    const ctx = createMockCtx({
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
    });

    for (const required of ["viewer", "editor", "owner"] as const) {
      const result = await checkPermission(ctx as never, NAMESPACE_ID, OWNER_ID, required);
      expect(result.role).toBe("owner");
      expect(result.isOwner).toBe(true);
    }
  });

  it("allows editor to perform viewer-level actions", async () => {
    const ctx = createMockCtx({
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
      membership: { role: "editor" },
    });

    const result = await checkPermission(ctx as never, NAMESPACE_ID, EDITOR_ID, "viewer");
    expect(result).toEqual({
      role: "editor",
      isOwner: false,
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
    });
  });

  it("allows editor to perform editor-level actions", async () => {
    const ctx = createMockCtx({
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
      membership: { role: "editor" },
    });

    const result = await checkPermission(ctx as never, NAMESPACE_ID, EDITOR_ID, "editor");
    expect(result).toEqual({
      role: "editor",
      isOwner: false,
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
    });
  });

  it("rejects editor for owner-level actions with generic error", async () => {
    const ctx = createMockCtx({
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
      membership: { role: "editor" },
    });

    await expect(checkPermission(ctx as never, NAMESPACE_ID, EDITOR_ID, "owner")).rejects.toThrow(
      ERR.NOT_AUTHORIZED,
    );
  });

  it("allows viewer to perform viewer-level actions", async () => {
    const ctx = createMockCtx({
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
      membership: { role: "viewer" },
    });

    const result = await checkPermission(ctx as never, NAMESPACE_ID, VIEWER_ID, "viewer");
    expect(result).toEqual({
      role: "viewer",
      isOwner: false,
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
    });
  });

  it("rejects viewer for editor-level actions with generic error", async () => {
    const ctx = createMockCtx({
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
      membership: { role: "viewer" },
    });

    await expect(checkPermission(ctx as never, NAMESPACE_ID, VIEWER_ID, "editor")).rejects.toThrow(
      ERR.NOT_AUTHORIZED,
    );
  });

  it("rejects viewer for owner-level actions with generic error", async () => {
    const ctx = createMockCtx({
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
      membership: { role: "viewer" },
    });

    await expect(checkPermission(ctx as never, NAMESPACE_ID, VIEWER_ID, "owner")).rejects.toThrow(
      ERR.NOT_AUTHORIZED,
    );
  });

  it("throws generic error when user is not a member", async () => {
    const ctx = createMockCtx({
      namespace: { _id: NAMESPACE_ID, owner: OWNER_ID },
      membership: null,
    });

    await expect(
      checkPermission(ctx as never, NAMESPACE_ID, STRANGER_ID, "viewer"),
    ).rejects.toThrow(ERR.NOT_AUTHORIZED);
  });

  it("throws generic error when namespace does not exist", async () => {
    const ctx = createMockCtx({ namespace: null });

    await expect(checkPermission(ctx as never, NAMESPACE_ID, OWNER_ID, "viewer")).rejects.toThrow(
      ERR.NOT_AUTHORIZED,
    );
  });
});
