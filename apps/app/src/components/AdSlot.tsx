import { useEffect, useRef } from "react";
import "./AdSlot.css";

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdSlotProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  isPremium?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function AdSlot({
  slot,
  format = "auto",
  responsive = true,
  isPremium = false,
  className,
  style,
}: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || isPremium) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not loaded (e.g., ad blocker)
    }
  }, [isPremium]);

  if (isPremium) return null;

  return (
    <div className={`ad-slot${className ? ` ${className}` : ""}`} style={style}>
      <span className="ad-slot-label">Ad</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT ?? ""}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

export default AdSlot;
