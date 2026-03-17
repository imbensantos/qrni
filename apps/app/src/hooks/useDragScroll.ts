import { useRef, useCallback } from "react";

interface DragScrollState {
  isDown: boolean;
  startX: number;
  scrollLeft: number;
}

interface UseDragScrollReturn {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  dragStateRef: React.RefObject<DragScrollState>;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: () => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Shared drag-to-scroll logic for horizontally scrollable rows.
 * Used by ControlsPanel (dot style row) and BulkPanel (dot style row).
 */
export function useDragScroll(): UseDragScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragScrollState>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
  });

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const row = scrollRef.current;
    if (!row) return;
    dragStateRef.current = {
      isDown: true,
      startX: e.pageX - row.offsetLeft,
      scrollLeft: row.scrollLeft,
    };
    row.classList.add("dragging");
  }, []);

  const onMouseUp = useCallback(() => {
    dragStateRef.current.isDown = false;
    scrollRef.current?.classList.remove("dragging");
  }, []);

  const onMouseLeave = onMouseUp;

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDown) return;
    e.preventDefault();
    const row = scrollRef.current;
    if (!row) return;
    const x = e.pageX - row.offsetLeft;
    row.scrollLeft = dragStateRef.current.scrollLeft - (x - dragStateRef.current.startX);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const row = scrollRef.current;
    if (!row) return;
    const touch = e.touches[0];
    dragStateRef.current = {
      isDown: true,
      startX: touch.pageX - row.offsetLeft,
      scrollLeft: row.scrollLeft,
    };
  }, []);

  const onTouchEnd = useCallback(() => {
    dragStateRef.current.isDown = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDown) return;
    const row = scrollRef.current;
    if (!row) return;
    const touch = e.touches[0];
    const x = touch.pageX - row.offsetLeft;
    row.scrollLeft = dragStateRef.current.scrollLeft - (x - dragStateRef.current.startX);
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const row = scrollRef.current;
    if (!row) return;
    if (e.key === "ArrowRight") {
      row.scrollLeft += 80;
      e.preventDefault();
    }
    if (e.key === "ArrowLeft") {
      row.scrollLeft -= 80;
      e.preventDefault();
    }
  }, []);

  return {
    scrollRef,
    dragStateRef,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onMouseMove,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onKeyDown,
  };
}
