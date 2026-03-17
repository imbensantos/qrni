import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
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
