import { describe, it, expect } from "vitest";
import { ERR } from "./lib/constants";

// ---------------------------------------------------------------------------
// S5. Misleading ALREADY_OWNER error for owner self-removal
//
// WHY THIS FAILS against current code:
//
//   In convex/collaboration.ts (removeMember handler, ~line 245):
//
//     if (isSelfRemoval && namespace.owner === user._id) {
//       throw new Error(ERR.ALREADY_OWNER);
//     }
//
//   ERR.ALREADY_OWNER = "You already own this namespace"
//
//   This error fires when the owner tries to leave/remove themselves.
//   The message "You already own this namespace" is misleading — it sounds
//   like the user tried to re-take ownership they already have, not that they
//   need to transfer ownership before they can leave.
//
//   A user who tries to leave a namespace they own will see this message and
//   have no idea they need to transfer ownership first. The error should
//   contain guidance such as "transfer ownership before leaving".
//
// After the fix, ERR.ALREADY_OWNER should be replaced with a new constant
// (e.g. ERR.OWNER_MUST_TRANSFER) whose message clearly states the requirement
// to transfer ownership before leaving.
//
// These tests check the ERR constant values directly — they do not require a
// full Convex runtime — and will fail because ERR.ALREADY_OWNER does not
// contain "transfer".
// ---------------------------------------------------------------------------

describe("S5: owner self-removal error message contains transfer guidance", () => {
  it("ERR.ALREADY_OWNER exists and is a non-empty string", () => {
    // This passes against the current code — the constant exists.
    expect(typeof ERR.ALREADY_OWNER).toBe("string");
    expect(ERR.ALREADY_OWNER.length).toBeGreaterThan(0);
  });

  it("ERR.ALREADY_OWNER message contains 'transfer' guidance", () => {
    // FAILS: current value is "You already own this namespace"
    // which says nothing about transferring ownership.
    //
    // After the fix the message (or a replacement constant) should say
    // something like "Owner must transfer ownership before leaving" so the
    // user knows what action to take.
    expect(ERR.ALREADY_OWNER.toLowerCase()).toContain("transfer");
  });

  it("owner self-removal error message does NOT just say 'you already own this'", () => {
    // FAILS: the current message is exactly "You already own this namespace",
    // which will contain "already own" — a phrase that implies a duplicate
    // ownership attempt rather than a self-removal blocked by policy.
    //
    // After the fix the message should explain the required action (transfer),
    // not repeat a state the user obviously already knows.
    const msg = ERR.ALREADY_OWNER.toLowerCase();
    const describesTransfer = msg.includes("transfer");
    const describesLeave = msg.includes("leav") || msg.includes("remov");
    // At least one of these must be true for the message to be actionable.
    expect(describesTransfer || describesLeave).toBe(true); // FAILS currently
  });

  it("owner self-removal error message mentions leaving or removal context", () => {
    // FAILS: "You already own this namespace" contains neither "leav" nor "remov"
    // nor "before" — none of the words that would make the error actionable
    // when an owner tries to leave.
    const msg = ERR.ALREADY_OWNER.toLowerCase();
    const hasActionableContext =
      msg.includes("leav") ||
      msg.includes("remov") ||
      msg.includes("before") ||
      msg.includes("transfer");
    expect(hasActionableContext).toBe(true); // FAILS: none of these are present
  });
});
