/**
 * ProfileDropdown regression tests — S13
 *
 * S13: ProfileDropdown uses inline SVGs for the chevron and sign-out icon.
 * These tests document the current rendering contract so that when the inline
 * SVGs are replaced with a shared icon component, the observable behaviour
 * (menu opens, sign-out option present, user info visible) is not broken.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileDropdown from "./ProfileDropdown";

// ── External dependency mocks ────────────────────────────────────────────────

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signOut: vi.fn(), signIn: vi.fn() }),
}));

vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => ({ trigger: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("../../hooks/useClickOutside", () => ({
  useClickOutside: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultUser = {
  name: "Jane Doe",
  email: "jane@example.com",
  image: undefined,
};

function renderDropdown(userOverrides: Partial<typeof defaultUser> = {}) {
  return render(<ProfileDropdown user={{ ...defaultUser, ...userOverrides }} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ProfileDropdown — S13: trigger button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the profile menu trigger button", () => {
    renderDropdown();
    expect(screen.getByRole("button", { name: /profile menu/i })).toBeInTheDocument();
  });

  it("displays the user's first name in the trigger button", () => {
    renderDropdown({ name: "Jane Doe" });
    expect(screen.getByText("Jane")).toBeInTheDocument();
  });

  it("displays the first name taken from email when name is absent", () => {
    renderDropdown({ name: undefined, email: "alice@example.com" });
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("renders the initial avatar fallback using the first letter of the name", () => {
    renderDropdown({ name: "Jane Doe", image: undefined });
    // The initial is rendered inside a span inside the trigger button
    const trigger = screen.getByRole("button", { name: /profile menu/i });
    expect(trigger.textContent).toContain("J");
  });

  it("renders an img avatar when user.image is provided", () => {
    const { container } = renderDropdown({ image: "https://example.com/avatar.jpg" });
    // The avatar img has alt="" (decorative) so it is not in the accessibility tree.
    // Use querySelector to confirm the element is rendered with the correct src.
    const img = container.querySelector("img.pd-trigger-avatar-img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("chevron SVG is present inside the trigger button", () => {
    renderDropdown();
    const trigger = screen.getByRole("button", { name: /profile menu/i });
    // The chevron is an SVG child of the button
    const chevron = trigger.querySelector("svg.pd-trigger-chevron");
    expect(chevron).not.toBeNull();
  });

  it("trigger button has aria-expanded false when menu is closed", () => {
    renderDropdown();
    expect(screen.getByRole("button", { name: /profile menu/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

describe("ProfileDropdown — S13: open menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menu is not visible before the trigger is clicked", () => {
    renderDropdown();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("clicking the trigger opens the dropdown menu", () => {
    renderDropdown();
    fireEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("trigger button has aria-expanded true when menu is open", () => {
    renderDropdown();
    fireEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    expect(screen.getByRole("button", { name: /profile menu/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("shows the user's full name inside the open menu", () => {
    renderDropdown({ name: "Jane Doe" });
    fireEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("shows the user's email inside the open menu", () => {
    renderDropdown({ email: "jane@example.com" });
    fireEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("renders a sign-out menu item", () => {
    renderDropdown();
    fireEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
  });

  it("sign-out menu item contains the sign-out SVG icon", () => {
    renderDropdown();
    fireEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    const menuItem = screen.getByRole("menuitem", { name: /sign out/i });
    expect(menuItem.querySelector("svg")).not.toBeNull();
  });

  it("clicking sign-out does not throw", () => {
    renderDropdown();
    fireEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    // Clicking sign-out should not throw — the action is handled by the mock
    expect(() =>
      fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i })),
    ).not.toThrow();
  });
});

describe("ProfileDropdown — S13: menu closes after interaction", () => {
  it("menu closes after clicking sign out", () => {
    renderDropdown();
    fireEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
