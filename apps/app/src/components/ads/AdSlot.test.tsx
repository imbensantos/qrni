import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import AdSlot from "./AdSlot";

beforeEach(() => {
  (window as any).adsbygoogle = [];
});

afterEach(() => {
  delete (window as any).adsbygoogle;
});

describe("AdSlot", () => {
  it("renders an ins element with correct data attributes", () => {
    const { container } = render(<AdSlot slot="1234567890" format="auto" />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).not.toBeNull();
    expect(ins?.getAttribute("data-ad-slot")).toBe("1234567890");
    expect(ins?.getAttribute("data-ad-format")).toBe("auto");
  });

  it("renders nothing when isPremium is true", () => {
    const { container } = render(<AdSlot slot="1234567890" format="auto" isPremium={true} />);
    expect(container.innerHTML).toBe("");
  });

  it("pushes to adsbygoogle array on mount", () => {
    render(<AdSlot slot="1234567890" format="auto" />);
    expect((window as any).adsbygoogle.length).toBe(1);
  });

  it("applies className when provided", () => {
    const { container } = render(<AdSlot slot="1234567890" format="auto" className="my-ad" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.contains("my-ad")).toBe(true);
  });
});
