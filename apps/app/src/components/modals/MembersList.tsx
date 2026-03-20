import { Id } from "../../../../../convex/_generated/dataModel";
import { IconClose, IconMail } from "../Icons";
import { getColorFromHash } from "../../utils/ui-utils";

const AVATAR_COLORS = ["#D89575", "#3D8A5A", "#7B68AE", "#5B8FD4", "#D4795B", "#8A6D3D", "#5BAED4"];

export interface Member {
  _id: Id<"namespace_members">;
  role: string;
  user?: {
    name?: string;
    email?: string;
  } | null;
}

export interface PendingInvite {
  _id: Id<"namespace_invites">;
  email?: string;
}

interface MembersListProps {
  members: Member[];
  pendingInvites: PendingInvite[];
  onRevoke: (inviteId: Id<"namespace_invites">) => void;
  onRemoveMember: (membershipId: Id<"namespace_members">) => void;
  isRemoving: boolean;
  confirmRemove: { membershipId: Id<"namespace_members">; memberName: string } | null;
  onConfirmRemove: (
    info: { membershipId: Id<"namespace_members">; memberName: string } | null,
  ) => void;
}

export function MembersList({
  members,
  pendingInvites,
  onRevoke,
  onRemoveMember,
  isRemoving,
  confirmRemove,
  onConfirmRemove,
}: MembersListProps) {
  return (
    <div className="imm-members-section">
      <h3 className="imm-members-heading">Current members</h3>
      <div className="imm-members-list">
        {members.map((member) => (
          <div key={member._id} className="imm-member-row">
            <div
              className="imm-avatar"
              style={{
                background: getColorFromHash(
                  member.user?.name || member.user?.email || "",
                  AVATAR_COLORS,
                ),
              }}
            >
              {(member.user?.name || member.user?.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="imm-member-info">
              <span className="imm-member-name">{member.user?.name || "Unknown"}</span>
              <span className="imm-member-email">{member.user?.email}</span>
            </div>
            <div className="imm-role-actions">
              <span className={`imm-role-badge imm-role-${member.role}`}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
              <button
                type="button"
                className="imm-revoke-btn"
                aria-label={`Remove ${member.user?.name || member.user?.email}`}
                onClick={() =>
                  onConfirmRemove({
                    membershipId: member._id,
                    memberName: member.user?.name || member.user?.email || "this member",
                  })
                }
              >
                <IconClose size={14} />
              </button>
            </div>
          </div>
        ))}

        {pendingInvites.map((invite) => (
          <div key={invite._id} className="imm-member-row">
            <div className="imm-avatar imm-avatar--pending">
              <IconMail size={14} />
            </div>
            <div className="imm-member-info">
              <span className="imm-pending-email">{invite.email}</span>
              <span className="imm-pending-status">Invitation sent</span>
            </div>
            <div className="imm-role-actions">
              <span className="imm-role-badge imm-role-pending">Pending</span>
              <button
                type="button"
                className="imm-revoke-btn"
                onClick={() => onRevoke(invite._id)}
                aria-label={`Revoke invite for ${invite.email}`}
              >
                <IconClose size={14} />
              </button>
            </div>
          </div>
        ))}

        {!members.length && !pendingInvites.length && (
          <p className="imm-empty">No members yet. Send an invite to get started.</p>
        )}
      </div>

      {confirmRemove && (
        <div className="imm-confirm-remove">
          <p>
            Remove <strong>{confirmRemove.memberName}</strong> from this namespace?
          </p>
          <div className="imm-confirm-actions">
            <button
              type="button"
              className="imm-confirm-cancel"
              onClick={() => onConfirmRemove(null)}
              disabled={isRemoving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="imm-confirm-remove-btn"
              onClick={() => onRemoveMember(confirmRemove.membershipId)}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
