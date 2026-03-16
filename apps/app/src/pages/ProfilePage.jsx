import { useState, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { Link } from '@tanstack/react-router'
import { api } from '../../../../convex/_generated/api'
import AddLinkModal from '../components/modals/AddLinkModal'
import './ProfilePage.css'

const NAMESPACE_COLORS = ['#D89575', '#3D8A5A', '#5B8BD4', '#9B6BC4', '#D4805B', '#5BAD8A']

function getNamespaceColor(index) {
  return NAMESPACE_COLORS[index % NAMESPACE_COLORS.length]
}

function formatDate(timestamp) {
  const d = new Date(timestamp)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

function formatMemberSince(timestamp) {
  const d = new Date(timestamp)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `Member since ${months[d.getMonth()]} ${d.getFullYear()}`
}

// Inline SVG icons
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

// Copy button with feedback
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: ignore
    }
  }, [text])

  return (
    <button className={`link-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy short URL">
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}

// Link row component
function LinkRow({ link, onEdit, onDelete }) {
  const shortUrl = link.namespaceSlug
    ? `qrni.co/${link.namespaceSlug}/${link.shortCode}`
    : `qrni.co/${link.shortCode}`

  return (
    <div className="link-row">
      <div className="link-info">
        <div className="link-short">
          <a href={`https://${shortUrl}`} target="_blank" rel="noopener noreferrer" className="link-short-url">
            {shortUrl}
          </a>
          <CopyButton text={`https://${shortUrl}`} />
        </div>
        <div className="link-destination">{link.destinationUrl}</div>
      </div>
      <div className="link-actions">
        <span className="link-clicks">
          <EyeIcon /> {link.clickCount}
        </span>
        <span className="link-date">{formatDate(link.createdAt)}</span>
        <button className="link-action-btn" onClick={() => onEdit(link)} title="Edit link">
          <PencilIcon />
        </button>
        <button className="link-action-btn delete" onClick={() => onDelete(link)} title="Delete link">
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

// My Links section
function MyLinksSection({ links, onAdd, onEdit, onDelete }) {
  const personalLinks = links ? links.filter(l => !l.namespace) : []
  const customSlugCount = personalLinks.filter(l => l.shortCode && l.shortCode.length > 6).length

  return (
    <div className="profile-section">
      <div className="section-header">
        <span className="section-icon"><LinkIcon /></span>
        <span className="section-title">My Links</span>
        <span className="section-count">{personalLinks.length}</span>
        <span className="section-slug-info">{customSlugCount} of 5 custom slugs used</span>
        <button className="section-add-btn" onClick={() => onAdd(null, null)}>
          <PlusIcon /> Add
        </button>
      </div>
      {personalLinks.length === 0 ? (
        <div className="empty-state">No links yet. Create your first short link!</div>
      ) : (
        personalLinks.map(link => (
          <LinkRow key={link._id} link={link} onEdit={onEdit} onDelete={onDelete} />
        ))
      )}
    </div>
  )
}

// Single namespace section
function NamespaceSection({ namespace, role, colorIndex, onAdd, onEdit, onDelete, onInvite, onViewAll }) {
  const [expanded, setExpanded] = useState(true)
  const nsLinks = useQuery(api.links.listNamespaceLinks, { namespaceId: namespace._id })
  const members = useQuery(api.collaboration.listMembers, { namespaceId: namespace._id })
  const color = getNamespaceColor(colorIndex)
  const canEdit = role === 'owner' || role === 'editor'
  const isOwner = role === 'owner'
  const previewLinks = nsLinks ? nsLinks.slice(0, 3) : []
  const totalLinks = nsLinks ? nsLinks.length : 0

  return (
    <div className="profile-section">
      <div className="namespace-header">
        <div className="namespace-avatar" style={{ background: color }}>
          {namespace.slug.charAt(0).toUpperCase()}
        </div>
        <span className="namespace-name">{namespace.slug}</span>
        <span className="namespace-link-count">{totalLinks} links</span>
        <span className={`role-badge ${role}`}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>

        {members && members.length > 0 && (
          <div className="member-stack">
            {members.slice(0, 4).map((member, i) => (
              <div
                key={member._id}
                className="member-avatar"
                style={{ background: getNamespaceColor(i + 1) }}
                title={member.name || 'Member'}
              >
                {member.image ? (
                  <img src={member.image} alt={member.name || 'Member'} />
                ) : (
                  (member.name || '?').charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {members.length > 4 && (
              <div className="member-avatar" style={{ background: '#999' }}>
                +{members.length - 4}
              </div>
            )}
          </div>
        )}

        {isOwner && (
          <button className="namespace-invite-btn" onClick={() => onInvite(namespace._id, namespace.slug)}>
            Invite
          </button>
        )}

        <button
          className={`namespace-toggle-btn ${expanded ? 'expanded' : ''}`}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronIcon />
        </button>
      </div>

      {expanded && (
        <>
          {previewLinks.length === 0 ? (
            <div className="empty-state">No links in this namespace yet.</div>
          ) : (
            previewLinks.map(link => (
              <LinkRow key={link._id} link={link} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            {totalLinks > 3 && (
              <button className="view-all-link" onClick={() => onViewAll(namespace._id, namespace.slug)}>
                View all {totalLinks} links →
              </button>
            )}
            {canEdit && (
              <button className="section-add-btn" style={{ marginLeft: 'auto' }} onClick={() => onAdd(namespace._id, namespace.slug)}>
                <PlusIcon /> Add link
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ProfilePage() {
  const user = useQuery(api.users.currentUser)
  const stats = useQuery(api.users.getUserStats)
  const myLinks = useQuery(api.links.listMyLinks)
  const namespaces = useQuery(api.namespaces.listMine)

  // Modal states (modals built in subsequent tasks)
  const [addLinkModal, setAddLinkModal] = useState({ open: false, namespaceId: null, namespaceSlug: null })
  const [editLinkModal, setEditLinkModal] = useState({ open: false, link: null })
  const [deleteLinkModal, setDeleteLinkModal] = useState({ open: false, link: null })
  const [createNamespaceModal, setCreateNamespaceModal] = useState(false)
  const [inviteModal, setInviteModal] = useState({ open: false, namespaceId: null, namespaceName: null })
  const [editProfileModal, setEditProfileModal] = useState(false)
  const [allLinksView, setAllLinksView] = useState({ active: false, namespaceId: null, namespaceName: null })

  // Suppress unused variable warnings in dev
  void editLinkModal
  void deleteLinkModal
  void createNamespaceModal
  void inviteModal
  void editProfileModal
  void allLinksView

  // Loading state
  if (user === undefined) {
    return (
      <main className="profile-page">
        <div className="profile-loading">Loading...</div>
      </main>
    )
  }

  // Auth guard
  if (user === null) {
    return (
      <main className="profile-page">
        <div className="profile-auth-guard">
          <p>Sign in to view your profile</p>
          <Link to="/">Back to home</Link>
        </div>
      </main>
    )
  }

  const avatarUrl = user.image || user.avatarUrl
  const displayName = user.name || 'User'
  const allNamespaces = [
    ...(namespaces?.owned || []).map(ns => ({ ...ns, role: 'owner' })),
    ...(namespaces?.collaborated || []).filter(Boolean),
  ]

  return (
    <main className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-info">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="profile-avatar" referrerPolicy="no-referrer" />
          ) : (
            <div className="profile-avatar-fallback">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="profile-details">
            <div className="profile-name-row">
              <span className="profile-name">{displayName}</span>
              <button className="profile-edit-btn" onClick={() => setEditProfileModal(true)} title="Edit profile">
                <PencilIcon />
              </button>
            </div>
            {user.email && <span className="profile-email">{user.email}</span>}
            {user.createdAt && <span className="profile-member-since">{formatMemberSince(user.createdAt)}</span>}
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <span className="stat-number">{stats?.totalLinks ?? 0}</span>
            <span className="stat-label">Links</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats?.totalClicks ?? 0}</span>
            <span className="stat-label">Clicks</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats?.totalNamespaces ?? 0}</span>
            <span className="stat-label">Namespaces</span>
          </div>
        </div>
      </div>

      {/* My Links Section */}
      <MyLinksSection
        links={myLinks}
        onAdd={(nsId, nsSlug) => setAddLinkModal({ open: true, namespaceId: nsId, namespaceSlug: nsSlug })}
        onEdit={(link) => setEditLinkModal({ open: true, link })}
        onDelete={(link) => setDeleteLinkModal({ open: true, link })}
      />

      {/* Namespace Sections */}
      {allNamespaces.map((ns, index) => (
        <NamespaceSection
          key={ns._id}
          namespace={ns}
          role={ns.role}
          colorIndex={index}
          onAdd={(nsId, nsSlug) => setAddLinkModal({ open: true, namespaceId: nsId, namespaceSlug: nsSlug })}
          onEdit={(link) => setEditLinkModal({ open: true, link })}
          onDelete={(link) => setDeleteLinkModal({ open: true, link })}
          onInvite={(nsId, nsName) => setInviteModal({ open: true, namespaceId: nsId, namespaceName: nsName })}
          onViewAll={(nsId, nsName) => setAllLinksView({ active: true, namespaceId: nsId, namespaceName: nsName })}
        />
      ))}

      {/* Create Namespace Button */}
      <button className="create-namespace-btn" onClick={() => setCreateNamespaceModal(true)}>
        + Create new namespace
      </button>

      {/* Modals */}
      <AddLinkModal
        isOpen={addLinkModal.open}
        onClose={() => setAddLinkModal({ open: false, namespaceId: null, namespaceSlug: null })}
        namespaceId={addLinkModal.namespaceId}
        namespaceSlug={addLinkModal.namespaceSlug}
      />
    </main>
  )
}

export default ProfilePage
