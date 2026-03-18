import { useRef, useCallback } from "react";
import { useWebHaptics } from "web-haptics/react";

interface SizeSliderProps {
  size: number;
  onSizeChange: (size: number) => void;
}

const HAPTIC_THROTTLE_MS = 80;

function SizeSlider({ size, onSizeChange }: SizeSliderProps) {
  const { trigger } = useWebHaptics();
  const lastHapticRef = useRef(0);

  const throttledTrigger = useCallback(() => {
    const now = Date.now();
    if (now - lastHapticRef.current >= HAPTIC_THROTTLE_MS) {
      lastHapticRef.current = now;
      trigger("rigid");
    }
  }, [trigger]);

  return (
    <section className="control-section" role="group" aria-labelledby="size-label">
      <div className="control-header">
        <span id="size-label" className="control-label">
          <svg
            className="section-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
          Size
        </span>
        <span className="size-value" aria-live="polite">
          {size} px
        </span>
      </div>
      <input
        type="range"
        min={128}
        max={2048}
        step={64}
        value={size}
        onChange={(e) => {
          onSizeChange(Number(e.target.value));
          throttledTrigger();
        }}
        className="size-slider"
        aria-label="QR code size in pixels"
        aria-valuemin={128}
        aria-valuemax={2048}
        aria-valuenow={size}
        aria-valuetext={`${size} pixels`}
      />
      <div className="size-range" aria-hidden="true">
        <span>128</span>
        <span>2048</span>
      </div>
    </section>
  );
}

export default SizeSlider;
