import { useEffect, useRef, useCallback, ReactNode } from "react";
import "./ModalBackdrop.css";

interface ModalBackdropProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  titleId?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

function ModalBackdrop({ isOpen, onClose, children, titleId }: ModalBackdropProps) {
  const mouseDownTarget = useRef<EventTarget | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        e.preventDefault();

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
          } else {
            const index = Array.from(focusable).indexOf(document.activeElement as HTMLElement);
            focusable[Math.max(0, index - 1)].focus();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
          } else {
            const index = Array.from(focusable).indexOf(document.activeElement as HTMLElement);
            focusable[Math.min(focusable.length - 1, index + 1)].focus();
          }
        }
      }
    },
    [onClose],
  );

  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);

    // Save scroll position and lock body scrolling
    const scrollY = window.scrollY;
    scrollYRef.current = scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    // Prevent touch scroll passthrough on the backdrop
    const backdrop = backdropRef.current;
    const handleTouchMove = (e: TouchEvent) => {
      // Only prevent default when touching the backdrop itself, not modal content
      if (e.target === backdrop) {
        e.preventDefault();
      }
    };
    backdrop?.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      backdrop?.removeEventListener("touchmove", handleTouchMove);

      // Restore body styles and scroll position
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollYRef.current);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onMouseDown={(e) => {
        mouseDownTarget.current = e.target;
      }}
      onClick={(e) => {
        // Only close if both mousedown and mouseup happened on the backdrop itself
        if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={contentRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {children}
      </div>
    </div>
  );
}

export default ModalBackdrop;
