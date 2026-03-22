import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { cleanConvexError } from "../../../../utils/errors";
import ModalBackdrop from "../../../common/ModalBackdrop";
import { IconTrash } from "../../../common/Icons";
import { Id } from "../../../../../../../convex/_generated/dataModel";

interface DeleteNamespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | undefined;
}

function DeleteNamespaceModal({
  isOpen,
  onClose,
  namespaceId,
  namespaceName,
}: DeleteNamespaceModalProps) {
  const { trigger } = useWebHaptics();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const removeNamespace = useMutation(api.namespaces.remove);

  if (!namespaceId) return null;

  // Capture before async callback to preserve TypeScript narrowing
  const safeNamespaceId = namespaceId;

  async function handleDelete() {
    setError(null);
    setSubmitting(true);
    try {
      await removeNamespace({ namespaceId: safeNamespaceId });
      onClose();
    } catch (err) {
      const msg = cleanConvexError((err as Error).message ?? "");
      setError(msg || "Failed to delete namespace");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} titleId="delete-ns-title">
      <div className="delete-modal">
        <div className="delete-modal-icon" style={{ color: "#DC2626" }}>
          <IconTrash size={28} />
        </div>

        <h2 id="delete-ns-title" className="delete-modal-title">
          Delete namespace?
        </h2>

        <p className="delete-modal-warning">
          This will permanently delete the namespace <strong>{namespaceName}</strong> and all links
          inside it. Anyone using these links will get a 404 error. This action cannot be undone.
        </p>

        {error && (
          <div className="delete-modal-error" role="alert">
            {error}
          </div>
        )}

        <div className="delete-modal-actions">
          <button
            className="delete-modal-cancel"
            onClick={() => {
              trigger("nudge");
              onClose();
            }}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="delete-modal-confirm"
            onClick={() => {
              trigger("nudge");
              handleDelete();
            }}
            disabled={submitting}
          >
            {submitting ? "Deleting..." : "Delete namespace"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export default DeleteNamespaceModal;
