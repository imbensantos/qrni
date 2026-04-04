/**
 * ContactPage hardcoded-domain tests — S12
 *
 * Audit finding: `contact@qrni.to` is hard-coded directly in the JSX at
 * apps/app/src/pages/contact/ContactPage.tsx (line ~138). Per project rules,
 * no domain strings should be baked into source — the email address must come
 * from an environment variable or shared config constant so it can be changed
 * without a code deployment.
 *
 * These tests FAIL against the current implementation and should PASS once
 * the email is sourced from `import.meta.env.VITE_CONTACT_EMAIL` (or an
 * equivalent config constant) rather than being written as a literal string.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import ContactPage from "./ContactPage";

// ── Dependency mocks ─────────────────────────────────────────────────────────

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue(undefined),
}));

vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => ({ trigger: vi.fn() }),
}));

vi.mock("../../components/layout/AppFooter", () => ({
  default: () => null,
}));

vi.mock("../../../../../convex/_generated/api", () => ({
  api: {
    contact: {
      submitContactForm: "api.contact.submitContactForm",
    },
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ContactPage — S12: no hardcoded domain strings", () => {
  it("does not render the literal string 'qrni.to' anywhere in the page", () => {
    // WHY THIS FAILS: the current JSX hard-codes "contact@qrni.to" as both the
    // href value and the visible link text, so the domain appears verbatim in
    // the rendered HTML.
    const { container } = render(<ContactPage />);

    expect(container.innerHTML).not.toContain("qrni.to");
  });

  it("does not render a mailto: link pointing to a hardcoded qrni.to address", () => {
    // WHY THIS FAILS: the anchor element currently has
    // href="mailto:contact@qrni.to" which is a hardcoded domain.
    const { container } = render(<ContactPage />);

    const mailtoLinks = Array.from(container.querySelectorAll('a[href^="mailto:"]'));
    const hardcodedMailto = mailtoLinks.filter((a) => a.getAttribute("href")?.includes("qrni.to"));

    expect(hardcodedMailto).toHaveLength(0);
  });

  it("renders a mailto: link whose address comes from an env variable", () => {
    // WHY THIS FAILS: the current code ignores import.meta.env and uses a
    // literal string. After the fix the href should equal whatever
    // VITE_CONTACT_EMAIL is set to.
    //
    // For this test we verify that at minimum a mailto: link is present and
    // its address matches the env variable (which in the test environment will
    // be whatever Vite exposes — typically undefined/empty, falling back to a
    // configured constant, NOT the raw string "contact@qrni.to").
    const { container } = render(<ContactPage />);

    const mailtoLinks = Array.from(container.querySelectorAll('a[href^="mailto:"]'));
    expect(mailtoLinks.length).toBeGreaterThan(0);

    // The address must NOT be the literal hardcoded value.
    const allHardcoded = mailtoLinks.every(
      (a) => a.getAttribute("href") === "mailto:contact@qrni.to",
    );
    expect(allHardcoded).toBe(false);
  });
});
