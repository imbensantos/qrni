import { useEffect, RefObject } from "react";

/**
 * Attaches click-outside and Escape-key listeners when `isOpen` is true,
 * calling `onClose` when either event fires outside `ref`.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  isOpen: boolean,
): void {
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [ref, onClose, isOpen]);
}
