import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { cleanConvexError } from "../../../../utils/errors";
import ModalBackdrop from "../../../common/ModalBackdrop";
import { IconArrowRight } from "../../../common/Icons";
import { Id } from "../../../../../../../convex/_generated/dataModel";

interface LeaveNamespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string;
}

function LeaveNamespaceModal({
  isOpen,
  onClose,
  namespaceId,
  namespaceName,
}: LeaveNamespaceModalProps) {
  const { trigger } = useWebHaptics();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const members = useQuery(
    api.collaboration.listMembers,
    isOpen && namespaceId ? { namespaceId } : "skip",
  );
  const currentUser = useQuery(api.users.currentUser, isOpen ? undefined : "skip");
  const removeMember = useMutation(api.collaboration.removeMember);

  if (!namespaceId) return null;

  const safeNamespaceId = namespaceId;
  const myMembership = members?.find((m) => m.user?._id === currentUser?._id);

  async function handleLeave() {
    if (!myMembership) return;
    setError(null);
    setSubmitting(true);
    try {
      await removeMember({
        namespaceId: safeNamespaceId,
        membershipId: myMembership._id,
      });
      onClose();
    } catch (err) {
      const msg = cleanConvexError((err as Error).message ?? "");
      setError(msg || "Failed to leave namespace");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="delete-modal">
        <div className="delete-modal-icon" style={{ color: "#D97706" }}>
          <IconArrowRight size={28} />
        </div>

        <h2 className="delete-modal-title">Leave namespace?</h2>

        <p className="delete-modal-warning">
          You will lose access to all links in <strong>{namespaceName}</strong>. You&apos;ll need a
          new invite to rejoin.
        </p>

        {error && <div className="delete-modal-error">{error}</div>}

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
              handleLeave();
            }}
            disabled={submitting || !myMembership}
          >
            {submitting ? "Leaving..." : "Leave namespace"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export default LeaveNamespaceModal;
