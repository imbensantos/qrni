import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import ModalBackdrop from './ModalBackdrop'
import './InviteMemberModal.css'

const AVATAR_COLORS = [
  '#D89575', '#3D8A5A', '#7B68AE', '#5B8FD4', '#D4795B', '#8A6D3D', '#5BAED4'
]

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function InviteMemberModal({ isOpen, onClose, namespaceId, namespaceName }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const members = useQuery(api.collaboration.listMembers, namespaceId ? { namespaceId } : 'skip')
  const invites = useQuery(api.collaboration.listInvites, namespaceId ? { namespaceId } : 'skip')
  const createEmailInvite = useMutation(api.collaboration.createEmailInvite)
  const revokeInvite = useMutation(api.collaboration.revokeInvite)

  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setRole('editor')
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="imm-title">Invite to {namespaceName}</h2>
              <p className="imm-subtitle">Add collaborators to this namespace</p>
            </div>
          </div>
          <button type="button" className="imm-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
                placeholder="colleague@example.com"
                autoFocus
              />
            </div>
            <select
              className="imm-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
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

        <div className="imm-members-section">
          <h3 className="imm-members-heading">Current members</h3>
          <div className="imm-members-list">
            {(members || []).map((member) => (
              <div key={member._id} className="imm-member-row">
                <div
                  className="imm-avatar"
                  style={{ background: getAvatarColor(member.user?.name || member.user?.email) }}
                >
                  {(member.user?.name || member.user?.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="imm-member-info">
                  <span className="imm-member-name">{member.user?.name || 'Unknown'}</span>
                  <span className="imm-member-email">{member.user?.email}</span>
                </div>
                <span className={`imm-role-badge imm-role-${member.role}`}>
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
              </div>
            ))}

            {pendingInvites.map((invite) => (
              <div key={invite._id} className="imm-member-row">
                <div
                  className="imm-avatar"
                  style={{ background: getAvatarColor(invite.email) }}
                >
                  {(invite.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="imm-member-info">
                  <span className="imm-member-email">{invite.email}</span>
                </div>
                <span className="imm-role-badge imm-role-pending">Pending</span>
                <button
                  type="button"
                  className="imm-revoke-btn"
                  onClick={() => handleRevoke(invite._id)}
                  aria-label={`Revoke invite for ${invite.email}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
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
