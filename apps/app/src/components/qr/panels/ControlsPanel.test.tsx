/**
 * ControlsPanel regression tests — S6 & S7
 *
 * S6: ControlsPanel has 13 props and delegates each to a specific child.
 * These tests pin the component's public API surface and rendering contract so
 * that an upcoming refactor (grouped props / context) cannot silently break the
 * composition.
 *
 * S7: Haptic trigger magic numbers (8, "nudge") are used inline throughout.
 * These tests document the EXACT events that fire haptics so that named
 * constants can safely replace raw numbers without changing observable behaviour.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ControlsPanel from "./ControlsPanel";

// ── External dependency mocks ────────────────────────────────────────────────

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => []),
  useAction: vi.fn(() => vi.fn()),
  useConvexAuth: vi.fn(() => ({ isAuthenticated: false, isLoading: false })),
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
}));

const mockTrigger = vi.fn();

vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => ({ trigger: mockTrigger }),
}));

// Mock the Convex generated API so the import resolves without the build artifact.
vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    links: {
      listMyLinks: "api.links.listMyLinks",
      createAnonymousLink: "api.links.createAnonymousLink",
      createAutoSlugLink: "api.links.createAutoSlugLink",
      createCustomSlugLink: "api.links.createCustomSlugLink",
      createNamespacedLink: "api.links.createNamespacedLink",
    },
    namespaces: {
      listMine: "api.namespaces.listMine",
    },
  },
}));

// Stub child components that render complex sub-trees or their own heavy deps.
// This keeps ControlsPanel tests focused on the panel's own wiring.
vi.mock("../controls/NamespaceDropdown", () => ({
  default: () => <div data-testid="namespace-dropdown" />,
}));

vi.mock("../../layout/AppFooter", () => ({
  default: () => <footer data-testid="app-footer" />,
}));

vi.mock("../../ads/AdSlot", () => ({
  default: () => null,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  url: "https://example.com",
  onUrlChange: vi.fn(),
  fgColor: "#000000",
  onFgColorChange: vi.fn(),
  bgColor: "#ffffff",
  onBgColorChange: vi.fn(),
  logo: null,
  onLogoChange: vi.fn(),
  dotStyle: "square",
  onDotStyleChange: vi.fn(),
  size: 512,
  onSizeChange: vi.fn(),
  shortenLink: false,
  onShortenLinkChange: vi.fn(),
  onShortLinkCreated: vi.fn(),
};

function renderPanel(overrides: Partial<typeof defaultProps> = {}) {
  return render(<ControlsPanel {...defaultProps} {...overrides} />);
}

// ── S6: Child component rendering ────────────────────────────────────────────

describe("ControlsPanel — S6: child components render", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the URL input", () => {
    renderPanel();
    expect(screen.getByRole("textbox", { name: /url/i })).toBeInTheDocument();
  });

  it("URL input reflects the url prop value", () => {
    renderPanel({ url: "https://test.example.com" });
    const input = screen.getByRole("textbox", { name: /url/i }) as HTMLInputElement;
    expect(input.value).toBe("https://test.example.com");
  });

  it("renders ColorPicker (Foreground label is visible)", () => {
    renderPanel();
    expect(screen.getByText("Foreground")).toBeInTheDocument();
  });

  it("renders ColorPicker (Background label is visible)", () => {
    renderPanel();
    expect(screen.getByText("Background")).toBeInTheDocument();
  });

  it("renders LogoUploader (Logo label is visible)", () => {
    renderPanel();
    expect(screen.getByText("Logo")).toBeInTheDocument();
  });

  it("renders DotStyleSelector (Dot Style label is visible)", () => {
    renderPanel();
    expect(screen.getByText("Dot Style")).toBeInTheDocument();
  });

  it("renders SizeSlider (Size label is visible)", () => {
    renderPanel();
    expect(screen.getByText("Size")).toBeInTheDocument();
  });
});

// ── S6: Prop → callback wiring ────────────────────────────────────────────────

describe("ControlsPanel — S6: prop callbacks fire on interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onUrlChange when the URL input changes", () => {
    const onUrlChange = vi.fn();
    renderPanel({ onUrlChange });
    fireEvent.change(screen.getByRole("textbox", { name: /url/i }), {
      target: { value: "https://new.example.com" },
    });
    expect(onUrlChange).toHaveBeenCalledWith("https://new.example.com");
  });

  it("calls onFgColorChange when the foreground color input changes", () => {
    const onFgColorChange = vi.fn();
    renderPanel({ onFgColorChange });
    const fgInput = screen.getByLabelText("Foreground color");
    fireEvent.change(fgInput, { target: { value: "#ff0000" } });
    expect(onFgColorChange).toHaveBeenCalledWith("#ff0000");
  });

  it("calls onBgColorChange when the background color input changes", () => {
    const onBgColorChange = vi.fn();
    renderPanel({ onBgColorChange });
    const bgInput = screen.getByLabelText("Background color");
    fireEvent.change(bgInput, { target: { value: "#ff00ff" } });
    expect(onBgColorChange).toHaveBeenCalledWith("#ff00ff");
  });

  it("calls onDotStyleChange when a dot style is selected", () => {
    const onDotStyleChange = vi.fn();
    renderPanel({ onDotStyleChange, dotStyle: "square" });
    // Click any dot style radio that is not currently selected
    fireEvent.click(screen.getByRole("radio", { name: /Dots/i }));
    expect(onDotStyleChange).toHaveBeenCalledWith("dots");
  });

  it("calls onSizeChange when the size slider changes", () => {
    const onSizeChange = vi.fn();
    renderPanel({ onSizeChange, size: 512 });
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1024" } });
    expect(onSizeChange).toHaveBeenCalledWith(1024);
  });
});

// ── S6: Short link toggle ─────────────────────────────────────────────────────

describe("ControlsPanel — S6: short link toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the short link toggle switch", () => {
    renderPanel();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("toggle aria-checked reflects the shortenLink prop (false)", () => {
    renderPanel({ shortenLink: false });
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("toggle aria-checked reflects the shortenLink prop (true)", () => {
    renderPanel({ shortenLink: true });
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onShortenLinkChange with true when toggled from off", () => {
    const onShortenLinkChange = vi.fn();
    renderPanel({ shortenLink: false, onShortenLinkChange });
    fireEvent.click(screen.getByRole("switch"));
    expect(onShortenLinkChange).toHaveBeenCalledWith(true);
  });

  it("calls onShortenLinkChange with false when toggled from on", () => {
    const onShortenLinkChange = vi.fn();
    renderPanel({ shortenLink: true, onShortenLinkChange });
    fireEvent.click(screen.getByRole("switch"));
    expect(onShortenLinkChange).toHaveBeenCalledWith(false);
  });

  it("calls onShortLinkCreated with null when toggle is turned off", () => {
    const onShortLinkCreated = vi.fn();
    renderPanel({ shortenLink: true, onShortLinkCreated });
    fireEvent.click(screen.getByRole("switch"));
    expect(onShortLinkCreated).toHaveBeenCalledWith(null);
  });

  it("short link options section is hidden when shortenLink is false", () => {
    renderPanel({ shortenLink: false });
    expect(screen.queryByText("Creating short link...")).not.toBeInTheDocument();
  });

  it("short link options section is visible when shortenLink is true", () => {
    renderPanel({ shortenLink: true });
    // The "Create Short Link" button is only rendered inside the options section
    expect(screen.getByRole("button", { name: /create short link/i })).toBeInTheDocument();
  });
});

// ── S7: Haptic feedback ───────────────────────────────────────────────────────

describe("ControlsPanel — S7: haptic feedback triggers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggers haptic (8) on URL input keydown", () => {
    renderPanel();
    const urlInput = screen.getByRole("textbox", { name: /url/i });
    fireEvent.keyDown(urlInput, { key: "a" });
    expect(mockTrigger).toHaveBeenCalledWith(8);
  });

  it("triggers haptic on toggle switch click", () => {
    renderPanel({ shortenLink: false });
    fireEvent.click(screen.getByRole("switch"));
    // The toggle fires trigger("nudge")
    expect(mockTrigger).toHaveBeenCalledWith("nudge");
  });

  it("trigger(8) is the value used for URL keydown, not another number", () => {
    renderPanel();
    fireEvent.keyDown(screen.getByRole("textbox", { name: /url/i }), { key: "x" });
    const calls = mockTrigger.mock.calls;
    const keydownCall = calls.find((c) => typeof c[0] === "number");
    expect(keydownCall?.[0]).toBe(8);
  });

  it('trigger("nudge") is the value used for the toggle, not a numeric value', () => {
    renderPanel({ shortenLink: false });
    fireEvent.click(screen.getByRole("switch"));
    const calls = mockTrigger.mock.calls;
    const nudgeCall = calls.find((c) => c[0] === "nudge");
    expect(nudgeCall).toBeDefined();
  });
});
