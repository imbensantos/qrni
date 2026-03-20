import React, { useState, useEffect, useCallback, useRef } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import ModalBackdrop from "../../../common/ModalBackdrop";
import { IconClose, IconChevronDown, IconUserPlus, IconMail } from "../../../common/Icons";
import { useClickOutside } from "../../../../hooks/useClickOutside";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { MembersList } from "./MembersList";
import "./InviteMemberModal.css";

type InviteRole = "editor" | "viewer";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string;
}

function InviteMemberModal({
  isOpen,
  onClose,
  namespaceId,
  namespaceName,
}: InviteMemberModalProps) {
  const { trigger } = useWebHaptics();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("editor");
  const [roleOpen, setRoleOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{
    membershipId: Id<"namespace_members">;
    memberName: string;
  } | null>(null);
  const roleRef = useRef<HTMLDivElement | null>(null);

  const members = useQuery(api.collaboration.listMembers, namespaceId ? { namespaceId } : "skip");
  const invites = useQuery(api.collaboration.listInvites, namespaceId ? { namespaceId } : "skip");
  const createEmailInvite = useMutation(api.collaboration.createEmailInvite);
  const revokeInvite = useMutation(api.collaboration.revokeInvite);
  const removeMember = useMutation(api.collaboration.removeMember);

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setRole("editor");
      setRoleOpen(false);
      setError("");
      setIsSubmitting(false);
      setIsRemoving(false);
      setConfirmRemove(null);
    }
  }, [isOpen]);

  const closeRoleDropdown = useCallback(() => setRoleOpen(false), []);
  useClickOutside(roleRef, closeRoleDropdown, roleOpen);

  const pendingInvites = (invites || []).filter((inv) => !inv.revoked);

  async function handleSendInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || isSubmitting || !namespaceId) return;

    setIsSubmitting(true);
    setError("");

    try {
      await createEmailInvite({ namespaceId, email: email.trim(), role });
      setEmail("");
    } catch (err) {
      setError((err as Error).message || "Failed to send invite");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveMember(membershipId: Id<"namespace_members">) {
    if (!namespaceId || isRemoving) return;
    setIsRemoving(true);
    try {
      await removeMember({ namespaceId, membershipId });
      setConfirmRemove(null);
    } catch (err) {
      setError((err as Error).message || "Failed to remove member");
      setConfirmRemove(null);
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleRevoke(inviteId: Id<"namespace_invites">) {
    if (!namespaceId) return;
    try {
      await revokeInvite({ namespaceId, inviteId });
    } catch (err) {
      setError((err as Error).message || "Failed to revoke invite");
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="invite-member-modal">
        <div className="imm-header">
          <div className="imm-header-left">
            <div className="imm-icon">
              <IconUserPlus size={20} />
            </div>
            <div>
              <h2 className="imm-title">Invite to {namespaceName}</h2>
              <p className="imm-subtitle">Add collaborators to this namespace</p>
            </div>
          </div>
          <button
            type="button"
            className="imm-close"
            onClick={() => {
              trigger("nudge");
              onClose();
            }}
            aria-label="Close"
          >
            <IconClose size={18} />
          </button>
        </div>

        <form className="imm-invite-form" onSubmit={handleSendInvite}>
          <div className="imm-input-row">
            <div className="imm-email-field">
              <IconMail size={16} className="imm-mail-icon" />
              <input
                className="imm-email-input"
                type="email"
                value={email}
                onKeyDown={() => trigger(8)}
                onBeforeInput={() => trigger(8)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Enter email address..."
                autoFocus
              />
            </div>
            <div className="imm-role-select" ref={roleRef}>
              <button
                type="button"
                className="imm-role-trigger"
                onClick={() => {
                  trigger(8);
                  setRoleOpen(!roleOpen);
                }}
              >
                <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                <span style={{ color: "#9C9B99", display: "contents" }}>
                  <IconChevronDown size={14} />
                </span>
              </button>
              {roleOpen && (
                <div className="imm-role-dropdown">
                  {(["editor", "viewer"] as InviteRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`imm-role-option ${r === role ? "imm-role-option--active" : ""}`}
                      onClick={() => {
                        trigger("nudge");
                        setRole(r);
                        setRoleOpen(false);
                      }}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="imm-send-btn"
              disabled={!email.trim() || isSubmitting}
              onClick={() => trigger("nudge")}
            >
              {isSubmitting ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>

        {error && (
          <p className="imm-error" role="alert">
            {error}
          </p>
        )}

        <hr className="imm-divider" />

        <MembersList
          members={members || []}
          pendingInvites={pendingInvites}
          onRevoke={handleRevoke}
          onRemoveMember={handleRemoveMember}
          isRemoving={isRemoving}
          confirmRemove={confirmRemove}
          onConfirmRemove={setConfirmRemove}
        />
      </div>
    </ModalBackdrop>
  );
}

export default InviteMemberModal;
