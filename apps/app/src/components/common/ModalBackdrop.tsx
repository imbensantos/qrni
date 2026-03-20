import { useEffect, useRef, ReactNode } from "react";
import "./ModalBackdrop.css";

interface ModalBackdropProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  titleId?: string;
}

function ModalBackdrop({ isOpen, onClose, children, titleId }: ModalBackdropProps) {
  const mouseDownTarget = useRef<EventTarget | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
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
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {children}
      </div>
    </div>
  );
}

export default ModalBackdrop;
