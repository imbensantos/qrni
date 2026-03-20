import { useState, useCallback } from "react";
import { useWebHaptics } from "web-haptics/react";
import { IconCopy, IconCheck } from "../common/Icons";

interface CopyButtonProps {
  text: string;
}

/** Icon shown briefly when copy fails */
function IconX({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Legacy clipboard fallback using a temporary textarea and execCommand.
 * Used when navigator.clipboard is unavailable (e.g., non-HTTPS contexts).
 */
function legacyCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  // Position offscreen to avoid visual flash
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const success = document.execCommand("copy");
    return success;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function CopyButton({ text }: CopyButtonProps) {
  const { trigger } = useWebHaptics();
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      trigger("success");
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // Fallback: legacy textarea + execCommand approach
      const success = legacyCopy(text);
      if (success) {
        trigger("success");
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
      } else {
        trigger("error");
        setState("error");
        setTimeout(() => setState("idle"), 2000);
      }
    }
  }, [text, trigger]);

  return (
    <button
      className={`pp-copy-btn${state === "copied" ? " copied" : state === "error" ? " error" : ""}`}
      onClick={handleCopy}
      title={state === "error" ? "Copy failed" : "Copy URL"}
    >
      {state === "copied" ? (
        <IconCheck size={12} />
      ) : state === "error" ? (
        <IconX size={12} />
      ) : (
        <IconCopy size={12} />
      )}
    </button>
  );
}

export default CopyButton;
