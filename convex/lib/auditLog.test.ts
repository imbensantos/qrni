import { describe, it, expect } from "vitest";

describe("auditLog", () => {
  it("exports logAudit function", async () => {
    const mod = await import("./auditLog");
    expect(typeof mod.logAudit).toBe("function");
  });
});
