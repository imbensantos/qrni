import "@testing-library/jest-dom/vitest";

// jsdom does not implement the Clipboard API. Define a writable stub so tests
// that exercise clipboard-dependent code can spy on navigator.clipboard.writeText.
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: () => Promise.resolve(),
    readText: () => Promise.resolve(""),
  },
  writable: true,
  configurable: true,
});
