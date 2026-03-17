import { useState, useCallback } from "react";
import { IconCopy, IconCheck } from "../Icons";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore clipboard errors
    }
  }, [text]);

  return (
    <button
      className={`pp-copy-btn${copied ? " copied" : ""}`}
      onClick={handleCopy}
      title="Copy URL"
    >
      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
    </button>
  );
}

export default CopyButton;
