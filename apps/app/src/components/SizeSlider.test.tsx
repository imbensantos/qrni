import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WebHaptics, defaultPatterns } from "web-haptics";
import SizeSlider from "./SizeSlider";

// Spy on the real library — no mocking, the actual trigger method runs
const triggerSpy = vi.spyOn(WebHaptics.prototype, "trigger");

beforeEach(() => {
  triggerSpy.mockClear();
});

afterEach(() => {
  document.querySelectorAll("label[for^='web-haptics']").forEach((el) => el.remove());
});

/**
 * Replicate the library's vibration pattern math so we can validate
 * that a trigger argument produces perceptible output.
 * Ported from web-haptics/dist/chunk-4NSAIXAB.mjs (functions C, w, M).
 */
const CHUNK_SIZE = 20;

function intensityPulse(duration: number, intensity: number): number[] {
  if (intensity >= 1) return [duration];
  if (intensity <= 0) return [];
  const onTime = Math.max(1, Math.round(CHUNK_SIZE * intensity));
  const offTime = CHUNK_SIZE - onTime;
  const result: number[] = [];
  let remaining = duration;
  while (remaining >= CHUNK_SIZE) {
    result.push(onTime, offTime);
    remaining -= CHUNK_SIZE;
  }
  if (remaining > 0) {
    const tail = Math.max(1, Math.round(remaining * intensity));
    result.push(tail);
    const gap = remaining - tail;
    if (gap > 0) result.push(gap);
  }
  return result;
}

type Vibration = { duration: number; intensity?: number; delay?: number };

function resolveInput(input: unknown): Vibration[] | null {
  if (typeof input === "number") return [{ duration: input }];
  if (typeof input === "string") {
    const preset = (defaultPatterns as Record<string, { pattern: Vibration[] }>)[input];
    if (!preset) return null;
    return preset.pattern.map((v) => ({ ...v }));
  }
  return null;
}

function buildVibratePattern(vibrations: Vibration[], defaultIntensity = 0.5): number[] {
  const result: number[] = [];
  for (const v of vibrations) {
    const intensity = Math.max(0, Math.min(1, v.intensity ?? defaultIntensity));
    const delay = v.delay ?? 0;
    if (delay > 0) {
      if (result.length > 0 && result.length % 2 === 0) {
        result[result.length - 1] += delay;
      } else {
        if (result.length === 0) result.push(0);
        result.push(delay);
      }
    }
    const pulses = intensityPulse(v.duration, intensity);
    if (pulses.length === 0) {
      if (result.length > 0 && result.length % 2 === 0) {
        result[result.length - 1] += v.duration;
      } else if (v.duration > 0) {
        result.push(0);
        result.push(v.duration);
      }
      continue;
    }
    for (const d of pulses) result.push(d);
  }
  return result;
}

/** Sum of vibrate-on segments (even indices in the pattern). */
function totalVibrateMs(pattern: number[]): number {
  return pattern.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
}

// ---------- helpers ----------

function renderSlider(overrides = {}) {
  const props = { size: 512, onSizeChange: vi.fn(), ...overrides };
  render(<SizeSlider {...props} />);
  return props;
}

// ---------- tests ----------

describe("SizeSlider", () => {
  it("renders the slider with correct value", () => {
    renderSlider({ size: 1024 });
    expect(screen.getByRole("slider")).toHaveValue("1024");
  });

  it("displays the current size", () => {
    renderSlider({ size: 512 });
    expect(screen.getByText("512 px")).toBeInTheDocument();
  });

  it("calls onSizeChange when slider value changes", () => {
    const props = renderSlider({ size: 512 });
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1024" } });
    expect(props.onSizeChange).toHaveBeenCalledWith(1024);
  });

  it("triggers haptic on change (fires during drag on all platforms)", () => {
    renderSlider();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1024" } });
    expect(triggerSpy).toHaveBeenCalled();
  });

  it("passes a haptic argument that produces perceptible vibration", () => {
    renderSlider();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1024" } });

    const arg = triggerSpy.mock.calls[0][0];
    const vibrations = resolveInput(arg);
    expect(vibrations).not.toBeNull();

    const pattern = buildVibratePattern(vibrations!);
    const onTimeMs = totalVibrateMs(pattern);
    // Minimum perceptible vibration is ~10ms on most devices
    expect(onTimeMs).toBeGreaterThanOrEqual(10);
  });

  it("triggers haptic on each change during continuous drag", () => {
    renderSlider();
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "256" } });
    fireEvent.change(slider, { target: { value: "768" } });
    fireEvent.change(slider, { target: { value: "1024" } });
    expect(triggerSpy).toHaveBeenCalledTimes(3);
  });
});
