import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import ModalBackdrop from './ModalBackdrop'
import { IconClose, IconChevronDown } from '../Icons'
import { useClickOutside } from '../../hooks/useClickOutside'
import { getColorFromHash } from '../../utils/ui-utils'
import './InviteMemberModal.css'

const AVATAR_COLORS = [
  '#D89575', '#3D8A5A', '#7B68AE', '#5B8FD4', '#D4795B', '#8A6D3D', '#5BAED4'
]

function InviteMemberModal({ isOpen, onClose, namespaceId, namespaceName }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [roleOpen, setRoleOpen] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const roleRef = useRef(null)

  const members = useQuery(api.collaboration.listMembers, namespaceId ? { namespaceId } : 'skip')
  const invites = useQuery(api.collaboration.listInvites, namespaceId ? { namespaceId } : 'skip')
  const createEmailInvite = useMutation(api.collaboration.createEmailInvite)
  const revokeInvite = useMutation(api.collaboration.revokeInvite)

  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setRole('editor')
      setRoleOpen(false)
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  const closeRoleDropdown = useCallback(() => setRoleOpen(false), [])
  useClickOutside(roleRef, closeRoleDropdown, roleOpen)

  const pendingInvites = (invites || []).filter((inv) => !inv.revoked)

  async function handleSendInvite(e) {
    e.preventDefault()
    if (!email.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError('')

    try {
      await createEmailInvite({ namespaceId, email: email.trim(), role })
      setEmail('')
    } catch (err) {
      setError(err.message || 'Failed to send invite')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRevoke(inviteId) {
    try {
      await revokeInvite({ namespaceId, inviteId })
    } catch (err) {
      setError(err.message || 'Failed to revoke invite')
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="invite-member-modal">
        <div className="imm-header">
          <div className="imm-header-left">
            <div className="imm-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <div>
              <h2 className="imm-title">Invite to {namespaceName}</h2>
              <p className="imm-subtitle">Add collaborators to this namespace</p>
            </div>
          </div>
          <button type="button" className="imm-close" onClick={onClose} aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>

        <form className="imm-invite-form" onSubmit={handleSendInvite}>
          <div className="imm-input-row">
            <div className="imm-email-field">
              <svg className="imm-mail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                className="imm-email-input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="Enter email address..."
                autoFocus
              />
            </div>
            <div className="imm-role-select" ref={roleRef}>
              <button
                type="button"
                className="imm-role-trigger"
                onClick={() => setRoleOpen(!roleOpen)}
              >
                <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                <span style={{ color: '#9C9B99', display: 'contents' }}>
                  <IconChevronDown size={14} />
                </span>
              </button>
              {roleOpen && (
                <div className="imm-role-dropdown">
                  {['editor', 'viewer'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`imm-role-option ${r === role ? 'imm-role-option--active' : ''}`}
                      onClick={() => { setRole(r); setRoleOpen(false) }}
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
            >
              {isSubmitting ? 'Sending...' : 'Send invite'}
            </button>
          </div>
        </form>

        {error && <p className="imm-error">{error}</p>}

        <hr className="imm-divider" />

        <div className="imm-members-section">
          <h3 className="imm-members-heading">Current members</h3>
          <div className="imm-members-list">
            {(members || []).map((member) => (
              <div key={member._id} className="imm-member-row">
                <div
                  className="imm-avatar"
                  style={{ background: getColorFromHash(member.user?.name || member.user?.email || '', AVATAR_COLORS) }}
                >
                  {(member.user?.name || member.user?.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="imm-member-info">
                  <span className="imm-member-name">{member.user?.name || 'Unknown'}</span>
                  <span className="imm-member-email">{member.user?.email}</span>
                </div>
                {member.role === 'owner' ? (
                  <span className="imm-role-badge imm-role-owner">Owner</span>
                ) : (
                  <div className="imm-role-actions">
                    <span className={`imm-role-badge imm-role-${member.role}`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                    <button
                      type="button"
                      className="imm-revoke-btn"
                      aria-label={`Remove ${member.user?.name || member.user?.email}`}
                    >
                      <IconClose size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {pendingInvites.map((invite) => (
              <div key={invite._id} className="imm-member-row">
                <div className="imm-avatar imm-avatar--pending">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
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
                    onClick={() => handleRevoke(invite._id)}
                    aria-label={`Revoke invite for ${invite.email}`}
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              </div>
            ))}

            {!members?.length && !pendingInvites.length && (
              <p className="imm-empty">No members yet. Send an invite to get started.</p>
            )}
          </div>
        </div>
      </div>
    </ModalBackdrop>
  )
}

export default InviteMemberModal
