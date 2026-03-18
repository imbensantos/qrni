import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyLinksSection from "./MyLinksSection";
import { Doc, Id } from "../../../../../convex/_generated/dataModel";

// Minimal factory to build a Doc<"links"> test fixture
function makeLink(overrides: Partial<Doc<"links">> = {}): Doc<"links"> {
  return {
    _id: "link_test_id" as Id<"links">,
    _creationTime: 0,
    shortCode: "abc123",
    destinationUrl: "https://example.com",
    clickCount: 0,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("MyLinksSection", () => {
  const defaultProps = {
    links: [] as Doc<"links">[],
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it("renders empty state when no links", () => {
    render(<MyLinksSection {...defaultProps} />);
    expect(screen.getByText(/no links yet/i)).toBeInTheDocument();
  });

  it("renders the section heading", () => {
    render(<MyLinksSection {...defaultProps} />);
    expect(screen.getByText("My Links")).toBeInTheDocument();
  });

  it("renders links when provided", () => {
    const links = [makeLink({ shortCode: "abc123" })];
    render(<MyLinksSection {...defaultProps} links={links} />);
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it("shows custom slug count", () => {
    render(<MyLinksSection {...defaultProps} links={[]} />);
    expect(screen.getByText(/0 of/)).toBeInTheDocument();
  });

  it("counts only non-auto slugs in custom slug count", () => {
    const links = [
      makeLink({ shortCode: "custom1", autoSlug: false }),
      makeLink({ _id: "link2" as Id<"links">, shortCode: "auto1", autoSlug: true }),
    ];
    render(<MyLinksSection {...defaultProps} links={links} />);
    // 1 custom slug out of MAX_CUSTOM_LINKS
    expect(screen.getByText(/1 of/)).toBeInTheDocument();
  });

  it("calls onAdd when Add button is clicked", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<MyLinksSection {...defaultProps} onAdd={onAdd} />);
    await user.click(screen.getByText("Add"));
    expect(onAdd).toHaveBeenCalledWith(null, null);
  });

  it("calls onEdit when edit button is clicked", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const link = makeLink({ shortCode: "edit1" });
    render(<MyLinksSection {...defaultProps} links={[link]} onEdit={onEdit} />);
    await user.click(screen.getByTitle("Edit link"));
    expect(onEdit).toHaveBeenCalledWith(link);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    const link = makeLink({ shortCode: "del1" });
    render(<MyLinksSection {...defaultProps} links={[link]} onDelete={onDelete} />);
    await user.click(screen.getByTitle("Delete link"));
    expect(onDelete).toHaveBeenCalledWith(link);
  });

  it("renders undefined links without crashing", () => {
    render(<MyLinksSection {...defaultProps} links={undefined} />);
    expect(screen.getByText(/no links yet/i)).toBeInTheDocument();
  });
});
