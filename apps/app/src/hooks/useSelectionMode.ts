import { useState } from "react";

interface SelectableItem {
  _id: unknown;
}

interface UseSelectionModeOptions<T extends SelectableItem> {
  /** Full list of items — used for delete filtering and auto-exit detection. */
  items: T[];
  /**
   * Subset of items eligible for select-all (e.g. the current page).
   * Defaults to `items` when omitted.
   */
  selectableItems?: T[];
  onBulkDelete: (selected: T[]) => void;
}

interface UseSelectionModeResult {
  selectionMode: boolean;
  selectedIds: Set<string>;
  enterSelectionMode: () => void;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  exitSelectionMode: () => void;
  handleBulkDelete: () => void;
}

export function useSelectionMode<T extends SelectableItem>({
  items,
  selectableItems,
  onBulkDelete,
}: UseSelectionModeOptions<T>): UseSelectionModeResult {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // The items eligible for select-all default to the full list.
  const toggleTargets = selectableItems ?? items;

  // Auto-exit selection mode when all selected items have been deleted.
  // This uses setState during render — the React-recommended derived-state pattern.
  if (selectionMode && selectedIds.size > 0) {
    const remaining = items.filter((item) => selectedIds.has(String(item._id)));
    if (remaining.length === 0) {
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = toggleTargets.every((item) => selectedIds.has(String(item._id)));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(toggleTargets.map((item) => String(item._id))));
    }
  };

  const enterSelectionMode = () => {
    setSelectionMode(true);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    const selected = items.filter((item) => selectedIds.has(String(item._id)));
    onBulkDelete(selected);
  };

  return {
    selectionMode,
    selectedIds,
    enterSelectionMode,
    toggleSelect,
    toggleSelectAll,
    exitSelectionMode,
    handleBulkDelete,
  };
}
