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

    // Save scroll position and lock body + html scrolling
    const scrollY = window.scrollY;
    scrollYRef.current = scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Document-level touchmove handler to prevent scroll passthrough on iOS Safari
    const content = contentRef.current;
    const handleDocumentTouchMove = (e: TouchEvent) => {
      const target = e.target as Node | null;
      // Walk up from touch target to check if it's inside modal content
      let isInsideContent = false;
      if (content && target) {
        isInsideContent = content.contains(target);
      }

      if (isInsideContent && content) {
        // Allow touch scrolling only if modal content is actually scrollable
        const isScrollable = content.scrollHeight > content.clientHeight;
        if (!isScrollable) {
          e.preventDefault();
        }
      } else {
        // Touch is outside modal content — always block
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", handleDocumentTouchMove, { passive: false });

    // Re-apply scroll lock when iOS virtual keyboard opens/closes
    const handleViewportResize = () => {
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.scrollTo(0, 0);
    };
    window.visualViewport?.addEventListener("resize", handleViewportResize);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchmove", handleDocumentTouchMove);
      window.visualViewport?.removeEventListener("resize", handleViewportResize);

      // Restore body + html styles and scroll position
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
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
