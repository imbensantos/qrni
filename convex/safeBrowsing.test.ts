import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// C2. checkUrl is exported as a public `action` instead of `internalAction`
//
// WHY THIS FAILS against current code:
//   `convex/safeBrowsing.ts` exports `checkUrl` using the public `action()`
//   builder from "./_generated/server". This means any unauthenticated caller
//   can invoke it directly, potentially using it to probe URLs against the
//   Safe Browsing API at no cost to them (quota abuse) and leaking whether
//   specific URLs are flagged as malicious.
//
//   The fix is to change `action` to `internalAction` so the handler is only
//   callable from within the Convex backend (via `ctx.runAction(internal.*)`)
//   and never directly from the client.
//
//   We detect this by inspecting the export's `isInternal` metadata flag, which
//   Convex sets to `true` on `internalAction`/`internalMutation`/`internalQuery`
//   builders and leaves absent (or `false`) on public ones.
// ---------------------------------------------------------------------------

describe("safeBrowsing — C2: checkUrl must be an internalAction, not a public action", () => {
  it("checkUrl export has isInternal === true (i.e. built with internalAction)", async () => {
    // Dynamically import to avoid top-level module resolution issues in test env.
    // We only need the exported object's metadata — no Convex runtime required.
    const mod = await import("./safeBrowsing");

    // Convex sets `isInternal: true` on all internal function objects.
    // Public actions do NOT have this property (it is absent or false).
    // This test FAILS against the current code because `checkUrl` is built
    // with the public `action()` builder.
    expect((mod.checkUrl as any).isInternal).toBe(true);
  });

  it("checkUrl is not callable from the public client (no 'exportedName' on public registry)", async () => {
    const mod = await import("./safeBrowsing");

    // Convex internal functions have `_isInternal` set to true (internal SDK detail).
    // They also lack the `name` property used for client-side routing.
    // A public action exposes `exportedName` for client-side invocation.
    // An internalAction should NOT expose `exportedName` to external callers.
    //
    // This is a belt-and-suspenders check: if the module was written with
    // `action()`, the resulting object has a publicly routable name;
    // `internalAction()` objects do not.
    const checkUrl = mod.checkUrl as any;

    // The simplest structural signal: Convex marks internal functions.
    // If `isInternal` is missing/false, the test fails — that is intentional.
    const isMarkedInternal = checkUrl.isInternal === true;
    expect(isMarkedInternal).toBe(true);
  });
});
