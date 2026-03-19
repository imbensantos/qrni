import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import AdSlot from "./AdSlot";

beforeEach(() => {
  (window as any).adsbygoogle = [];
});

afterEach(() => {
  delete (window as any).adsbygoogle;
});

describe("AdSlot integration", () => {
  it("renders with horizontal format", () => {
    const { container } = render(<AdSlot slot="123" format="horizontal" />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins?.getAttribute("data-ad-format")).toBe("horizontal");
  });

  it("renders with vertical format for pillar ads", () => {
    const { container } = render(<AdSlot slot="456" format="vertical" responsive={false} />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins?.getAttribute("data-ad-format")).toBe("vertical");
    expect(ins?.getAttribute("data-full-width-responsive")).toBe("false");
  });

  it("does not push to adsbygoogle when premium", () => {
    render(<AdSlot slot="789" isPremium={true} />);
    expect((window as any).adsbygoogle.length).toBe(0);
  });
});
