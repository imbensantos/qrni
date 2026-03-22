/**
 * Modal accessibility tests — I12
 *
 * Audit finding: DeleteNamespaceModal, LeaveNamespaceModal, and EditProfileModal
 * all render <ModalBackdrop> without a `titleId` prop. This means the dialog
 * element has no `aria-labelledby` attribute, so screen readers cannot announce
 * what the modal is about when focus enters it.
 *
 * WCAG 2.1 SC 4.1.2 requires dialogs to have an accessible name via either
 * aria-label or aria-labelledby pointing to a visible heading.
 *
 * These tests FAIL against the current implementation because:
 *   - DeleteNamespaceModal: passes no titleId → aria-labelledby is absent
 *   - LeaveNamespaceModal:  passes no titleId → aria-labelledby is absent
 *   - EditProfileModal:     passes no titleId → aria-labelledby is absent
 *
 * Each test verifies that:
 *   1. The dialog element has an aria-labelledby attribute.
 *   2. That attribute references a heading element present in the DOM.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Convex / external dependency mocks ───────────────────────────────────────

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => vi.fn()),
}));

vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => ({ trigger: vi.fn() }),
}));

// Stub Convex generated API — components import from this path
vi.mock("../../../../../../convex/_generated/api", () => ({
  api: new Proxy(
    {},
    {
      get: (_target, prop) =>
        new Proxy(
          {},
          {
            get: (_t, p) => `${String(prop)}.${String(p)}`,
          },
        ),
    },
  ),
}));

// Stub Convex dataModel types — only used for Id<"..."> generics at runtime
vi.mock("../../../../../../convex/_generated/dataModel", () => ({}));

// ── Component imports (after vi.mock hoisting) ────────────────────────────────

import { useQuery } from "convex/react";
import DeleteNamespaceModal from "./namespaces/DeleteNamespaceModal";
import LeaveNamespaceModal from "./namespaces/LeaveNamespaceModal";
import EditProfileModal from "./user/EditProfileModal";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Assert that a rendered dialog has aria-labelledby pointing to a visible
 * heading element in the document.
 */
function assertDialogIsLabelled() {
  const dialog = screen.getByRole("dialog");

  // Step 1 — the attribute must exist
  const labelledBy = dialog.getAttribute("aria-labelledby");
  expect(labelledBy, "dialog must have an aria-labelledby attribute").not.toBeNull();
  expect(labelledBy, "aria-labelledby must not be empty").not.toBe("");

  // Step 2 — the referenced element must exist in the DOM
  const labelElement = document.getElementById(labelledBy!);
  expect(
    labelElement,
    `element with id="${labelledBy}" referenced by aria-labelledby must exist in the DOM`,
  ).not.toBeNull();

  // Step 3 — the referenced element should be a heading
  const tag = labelElement!.tagName.toLowerCase();
  expect(
    ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag),
    `aria-labelledby must point to a heading element, got <${tag}>`,
  ).toBe(true);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Modal accessibility — I12: dialogs must have aria-labelledby", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: useQuery returns undefined (loading state) so components don't crash
    vi.mocked(useQuery).mockReturnValue(undefined as any);
  });

  /**
   * FAILS because DeleteNamespaceModal renders:
   *   <ModalBackdrop isOpen={isOpen} onClose={onClose}>
   * with no titleId prop — so ModalBackdrop renders:
   *   <div role="dialog" aria-modal="true" aria-labelledby={undefined}>
   * and the aria-labelledby attribute is absent from the DOM.
   */
  it("DeleteNamespaceModal: dialog has aria-labelledby pointing to its heading", () => {
    render(
      <DeleteNamespaceModal
        isOpen={true}
        onClose={vi.fn()}
        namespaceId={"namespace-id-1" as any}
        namespaceName="My Workspace"
      />,
    );

    assertDialogIsLabelled();
  });

  /**
   * FAILS because LeaveNamespaceModal renders:
   *   <ModalBackdrop isOpen={isOpen} onClose={onClose}>
   * with no titleId prop — so ModalBackdrop renders:
   *   <div role="dialog" aria-modal="true" aria-labelledby={undefined}>
   * and the aria-labelledby attribute is absent from the DOM.
   */
  it("LeaveNamespaceModal: dialog has aria-labelledby pointing to its heading", () => {
    // Provide member list so the component renders without crashing
    vi.mocked(useQuery).mockReturnValue([] as any);

    render(
      <LeaveNamespaceModal
        isOpen={true}
        onClose={vi.fn()}
        namespaceId={"namespace-id-2" as any}
        namespaceName="Team Namespace"
      />,
    );

    assertDialogIsLabelled();
  });

  /**
   * FAILS because EditProfileModal renders:
   *   <ModalBackdrop isOpen={isOpen} onClose={onClose}>
   * with no titleId prop — so ModalBackdrop renders:
   *   <div role="dialog" aria-modal="true" aria-labelledby={undefined}>
   * and the aria-labelledby attribute is absent from the DOM.
   */
  it("EditProfileModal: dialog has aria-labelledby pointing to its heading", () => {
    render(
      <EditProfileModal
        isOpen={true}
        onClose={vi.fn()}
        user={{ name: "Jane", email: "jane@example.com" }}
      />,
    );

    assertDialogIsLabelled();
  });
});
