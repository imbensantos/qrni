import { useEffect } from "react";

/**
 * Attaches click-outside and Escape-key listeners when `isOpen` is true,
 * calling `onClose` when either event fires outside `ref`.
 *
 * @param {React.RefObject} ref      - Ref attached to the element to exclude
 * @param {() => void}      onClose  - Callback to close the element
 * @param {boolean}         isOpen   - Whether the element is currently open
 */
export function useClickOutside(ref, onClose, isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }

    function handleEscape(e) {
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
