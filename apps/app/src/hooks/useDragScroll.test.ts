import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDragScroll } from "./useDragScroll";

describe("useDragScroll", () => {
  it("returns all expected handler properties", () => {
    const { result } = renderHook(() => useDragScroll());
    const keys = Object.keys(result.current);
    expect(keys).toEqual(
      expect.arrayContaining([
        "scrollRef",
        "dragStateRef",
        "onMouseDown",
        "onMouseUp",
        "onMouseLeave",
        "onMouseMove",
        "onTouchStart",
        "onTouchEnd",
        "onTouchMove",
        "onKeyDown",
      ]),
    );
  });

  it("all handler functions are defined", () => {
    const { result } = renderHook(() => useDragScroll());
    expect(typeof result.current.onMouseDown).toBe("function");
    expect(typeof result.current.onMouseUp).toBe("function");
    expect(typeof result.current.onMouseLeave).toBe("function");
    expect(typeof result.current.onMouseMove).toBe("function");
    expect(typeof result.current.onTouchStart).toBe("function");
    expect(typeof result.current.onTouchEnd).toBe("function");
    expect(typeof result.current.onTouchMove).toBe("function");
    expect(typeof result.current.onKeyDown).toBe("function");
  });

  it("handler references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useDragScroll());
    const first = { ...result.current };
    rerender();
    expect(result.current.onMouseDown).toBe(first.onMouseDown);
    expect(result.current.onMouseUp).toBe(first.onMouseUp);
    expect(result.current.onMouseMove).toBe(first.onMouseMove);
    expect(result.current.onKeyDown).toBe(first.onKeyDown);
  });
});

describe("useDragScroll — behavior", () => {
  function createMockDiv(overrides: Partial<HTMLDivElement> = {}): HTMLDivElement {
    return {
      scrollLeft: 0,
      offsetLeft: 0,
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
      ...overrides,
    } as unknown as HTMLDivElement;
  }

  it("mouse drag updates scrollLeft", () => {
    const { result } = renderHook(() => useDragScroll());
    const mockDiv = createMockDiv();

    Object.defineProperty(result.current.scrollRef, "current", {
      value: mockDiv,
      writable: true,
    });

    act(() => {
      result.current.onMouseDown({
        pageX: 100,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<HTMLDivElement>);
    });

    expect(mockDiv.classList.add).toHaveBeenCalledWith("dragging");

    act(() => {
      result.current.onMouseMove({
        pageX: 80,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<HTMLDivElement>);
    });

    expect(mockDiv.scrollLeft).toBe(20);
  });

  it("mouseup stops dragging and removes class", () => {
    const { result } = renderHook(() => useDragScroll());
    const mockDiv = createMockDiv();

    Object.defineProperty(result.current.scrollRef, "current", {
      value: mockDiv,
      writable: true,
    });

    act(() => {
      result.current.onMouseDown({
        pageX: 100,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<HTMLDivElement>);
    });

    act(() => {
      result.current.onMouseUp();
    });

    expect(mockDiv.classList.remove).toHaveBeenCalledWith("dragging");

    const prevScroll = mockDiv.scrollLeft;
    act(() => {
      result.current.onMouseMove({
        pageX: 50,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<HTMLDivElement>);
    });
    expect(mockDiv.scrollLeft).toBe(prevScroll);
  });

  it("arrow keys scroll by 80px", () => {
    const { result } = renderHook(() => useDragScroll());
    const mockDiv = createMockDiv({ scrollLeft: 100 });

    Object.defineProperty(result.current.scrollRef, "current", {
      value: mockDiv,
      writable: true,
    });

    act(() => {
      result.current.onKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>);
    });
    expect(mockDiv.scrollLeft).toBe(180);

    act(() => {
      result.current.onKeyDown({
        key: "ArrowLeft",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>);
    });
    expect(mockDiv.scrollLeft).toBe(100);
  });

  it("mouseleave stops dragging", () => {
    const { result } = renderHook(() => useDragScroll());
    const mockDiv = createMockDiv();

    Object.defineProperty(result.current.scrollRef, "current", {
      value: mockDiv,
      writable: true,
    });

    act(() => {
      result.current.onMouseDown({
        pageX: 100,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<HTMLDivElement>);
    });

    act(() => {
      result.current.onMouseLeave();
    });

    expect(mockDiv.classList.remove).toHaveBeenCalledWith("dragging");
  });

  it("touch drag updates scrollLeft", () => {
    const { result } = renderHook(() => useDragScroll());
    const mockDiv = createMockDiv();

    Object.defineProperty(result.current.scrollRef, "current", {
      value: mockDiv,
      writable: true,
    });

    act(() => {
      result.current.onTouchStart({
        touches: [{ pageX: 200 }],
      } as unknown as React.TouchEvent<HTMLDivElement>);
    });

    act(() => {
      result.current.onTouchMove({
        touches: [{ pageX: 170 }],
      } as unknown as React.TouchEvent<HTMLDivElement>);
    });

    expect(mockDiv.scrollLeft).toBe(30);
  });
});
