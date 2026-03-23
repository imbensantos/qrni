import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSelectionMode } from "./useSelectionMode";

function makeItem(id: string) {
  return { _id: id };
}

describe("useSelectionMode", () => {
  const onBulkDelete = vi.fn();

  beforeEach(() => {
    onBulkDelete.mockClear();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it("starts with selectionMode off and no selected ids", () => {
    const items = [makeItem("a"), makeItem("b")];
    const { result } = renderHook(() => useSelectionMode({ items, onBulkDelete }));
    expect(result.current.selectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  // ── toggleSelect ───────────────────────────────────────────────────────────

  it("toggleSelect adds an id that is not yet selected", () => {
    const items = [makeItem("a"), makeItem("b")];
    const { result } = renderHook(() => useSelectionMode({ items, onBulkDelete }));
    act(() => result.current.toggleSelect("a"));
    expect(result.current.selectedIds.has("a")).toBe(true);
    expect(result.current.selectedIds.size).toBe(1);
  });

  it("toggleSelect removes an id that is already selected", () => {
    const items = [makeItem("a"), makeItem("b")];
    const { result } = renderHook(() => useSelectionMode({ items, onBulkDelete }));
    act(() => result.current.toggleSelect("a"));
    act(() => result.current.toggleSelect("a"));
    expect(result.current.selectedIds.has("a")).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  // ── toggleSelectAll ────────────────────────────────────────────────────────

  it("toggleSelectAll selects all items when not all are selected", () => {
    const items = [makeItem("a"), makeItem("b"), makeItem("c")];
    const { result } = renderHook(() => useSelectionMode({ items, onBulkDelete }));
    act(() => result.current.toggleSelectAll());
    expect(result.current.selectedIds.size).toBe(3);
    expect(result.current.selectedIds.has("a")).toBe(true);
    expect(result.current.selectedIds.has("b")).toBe(true);
    expect(result.current.selectedIds.has("c")).toBe(true);
  });

  it("toggleSelectAll deselects all when every item is already selected", () => {
    const items = [makeItem("a"), makeItem("b")];
    const { result } = renderHook(() => useSelectionMode({ items, onBulkDelete }));
    act(() => result.current.toggleSelectAll());
    act(() => result.current.toggleSelectAll());
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("toggleSelectAll operates on selectableItems when provided", () => {
    const items = [makeItem("a"), makeItem("b"), makeItem("c")];
    // Only "a" and "b" are on the current page
    const selectableItems = [makeItem("a"), makeItem("b")];
    const { result } = renderHook(() => useSelectionMode({ items, selectableItems, onBulkDelete }));
    act(() => result.current.toggleSelectAll());
    expect(result.current.selectedIds.size).toBe(2);
    expect(result.current.selectedIds.has("a")).toBe(true);
    expect(result.current.selectedIds.has("b")).toBe(true);
    expect(result.current.selectedIds.has("c")).toBe(false);
  });

  it("toggleSelectAll deselects all when every selectableItem is selected", () => {
    const items = [makeItem("a"), makeItem("b"), makeItem("c")];
    const selectableItems = [makeItem("a"), makeItem("b")];
    const { result } = renderHook(() => useSelectionMode({ items, selectableItems, onBulkDelete }));
    // Select the page
    act(() => result.current.toggleSelectAll());
    // Deselect the page
    act(() => result.current.toggleSelectAll());
    expect(result.current.selectedIds.size).toBe(0);
  });

  // ── exitSelectionMode ──────────────────────────────────────────────────────

  it("exitSelectionMode clears selectionMode and selectedIds", () => {
    const items = [makeItem("a"), makeItem("b")];
    const { result } = renderHook(() => useSelectionMode({ items, onBulkDelete }));
    act(() => result.current.toggleSelect("a"));
    act(() => result.current.exitSelectionMode());
    expect(result.current.selectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  // ── handleBulkDelete ──────────────────────────────────────────────────────

  it("handleBulkDelete calls onBulkDelete with only the selected items", () => {
    const items = [makeItem("a"), makeItem("b"), makeItem("c")];
    const { result } = renderHook(() => useSelectionMode({ items, onBulkDelete }));
    act(() => result.current.toggleSelect("a"));
    act(() => result.current.toggleSelect("c"));
    act(() => result.current.handleBulkDelete());
    expect(onBulkDelete).toHaveBeenCalledTimes(1);
    const called = onBulkDelete.mock.calls[0][0];
    expect(called).toHaveLength(2);
    expect(called.map((i: { _id: string }) => i._id)).toEqual(expect.arrayContaining(["a", "c"]));
  });

  it("handleBulkDelete calls onBulkDelete with an empty array when nothing is selected", () => {
    const items = [makeItem("a"), makeItem("b")];
    const { result } = renderHook(() => useSelectionMode({ items, onBulkDelete }));
    act(() => result.current.handleBulkDelete());
    expect(onBulkDelete).toHaveBeenCalledWith([]);
  });

  // ── Auto-exit (derived state) ──────────────────────────────────────────────

  it("auto-exits selection mode when all selected items are removed from items", () => {
    const items = [makeItem("a"), makeItem("b")];
    const { result, rerender } = renderHook(
      ({ currentItems }) => useSelectionMode({ items: currentItems, onBulkDelete }),
      { initialProps: { currentItems: items } },
    );

    // Enter selection mode and select "a"
    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelect("a");
    });

    expect(result.current.selectionMode).toBe(true);
    expect(result.current.selectedIds.has("a")).toBe(true);

    // Rerender with items where "a" has been removed (simulates deletion)
    rerender({ currentItems: [makeItem("b")] });

    // Auto-exit fires during render: selectionMode and selectedIds both cleared
    expect(result.current.selectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });
});
