/**
 * useShortLink hook tests — S10
 *
 * Audit finding: `useQuery(api.links.listMyLinks)` and
 * `useQuery(api.namespaces.listMine)` are called unconditionally, even when
 * the user is not authenticated. For anonymous users these queries hit the
 * Convex backend unnecessarily and may expose data they shouldn't see.
 * The Convex `useQuery` hook accepts the string `"skip"` as its first argument
 * to suppress the query entirely.
 *
 * These tests FAIL against the current implementation and should PASS once the
 * two `useQuery` calls are guarded by `isAuthenticated`:
 *
 *   const myLinks    = useQuery(isAuthenticated ? api.links.listMyLinks    : "skip") ?? [];
 *   const myNamespaces = useQuery(isAuthenticated ? api.namespaces.listMine : "skip");
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ── Shared mock state ────────────────────────────────────────────────────────

let mockIsAuthenticated = false;

// Capture every argument that useQuery is called with so we can assert on them.
const useQueryCalls: unknown[][] = [];

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => {
    useQueryCalls.push(args);
    // Return undefined to simulate a pending / skipped query.
    return undefined;
  },
  useAction: () => vi.fn(),
}));

vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => ({ trigger: vi.fn() }),
}));

vi.mock("./useAuth", () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated, isLoading: false }),
}));

// The hook imports these utils — provide lightweight stubs so the module loads.
vi.mock("../utils/session-id", () => ({
  getSessionId: () => "test-session-id",
}));

vi.mock("../utils/errors", () => ({
  cleanConvexError: (msg: string) => msg,
}));

vi.mock("../utils/bulk-utils", () => ({
  isValidUrl: (url: string) => url.startsWith("http"),
}));

// Stub the generated Convex API so the import resolves without the build artefact.
vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    links: {
      listMyLinks: "api.links.listMyLinks",
      createAnonymousLink: "api.links.createAnonymousLink",
      createAutoSlugLink: "api.links.createAutoSlugLink",
      createCustomSlugLink: "api.links.createCustomSlugLink",
      createNamespacedLink: "api.links.createNamespacedLink",
    },
    namespaces: {
      listMine: "api.namespaces.listMine",
    },
  },
}));

// ── Tests ────────────────────────────────────────────────────────────────────

import { useShortLink } from "./useShortLink";

describe("useShortLink — S10: queries skipped for unauthenticated users", () => {
  beforeEach(() => {
    useQueryCalls.length = 0;
  });

  it('passes "skip" as the second argument to listMyLinks when user is not authenticated', () => {
    mockIsAuthenticated = false;
    renderHook(() => useShortLink());

    // Convex useQuery skip pattern: useQuery(apiRef, "skip")
    const linksCall = useQueryCalls.find((args) => args[0] === "api.links.listMyLinks");
    expect(linksCall).toBeDefined();
    expect(linksCall![1]).toBe("skip");
  });

  it('passes "skip" as the second argument to listMine when user is not authenticated', () => {
    mockIsAuthenticated = false;
    renderHook(() => useShortLink());

    const namespacesCall = useQueryCalls.find((args) => args[0] === "api.namespaces.listMine");
    expect(namespacesCall).toBeDefined();
    expect(namespacesCall![1]).toBe("skip");
  });

  it('both queries receive "skip" as second arg when unauthenticated', () => {
    mockIsAuthenticated = false;
    renderHook(() => useShortLink());

    const skipCalls = useQueryCalls.filter((args) => args[1] === "skip");
    expect(skipCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("calls useQuery with the real API references when user IS authenticated", () => {
    // This test verifies the positive path is not accidentally broken by the fix.
    // It should pass before AND after the fix — it documents the intended behavior
    // for authenticated users.
    mockIsAuthenticated = true;
    renderHook(() => useShortLink());

    const linksCall = useQueryCalls.find((args) => args[0] === "api.links.listMyLinks");
    const namespacesCall = useQueryCalls.find((args) => args[0] === "api.namespaces.listMine");

    expect(linksCall).toBeDefined();
    expect(namespacesCall).toBeDefined();
  });
});
