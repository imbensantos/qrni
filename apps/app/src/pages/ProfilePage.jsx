import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { Link } from '@tanstack/react-router'
import { api } from '../../../../convex/_generated/api'
import AddLinkModal from '../components/modals/AddLinkModal'
import EditLinkModal from '../components/modals/EditLinkModal'
import DeleteLinkConfirmModal from '../components/modals/DeleteLinkConfirmModal'
import CreateNamespaceModal from '../components/modals/CreateNamespaceModal'
import InviteMemberModal from '../components/modals/InviteMemberModal'
import EditProfileModal from '../components/modals/EditProfileModal'
import DeleteNamespaceModal from '../components/modals/DeleteNamespaceModal'
import RenameNamespaceModal from '../components/modals/RenameNamespaceModal'
import './ProfilePage.css'

const NAMESPACE_COLORS = ['#D89575', '#3D8A5A', '#5B8BD4', '#9B6BC4', '#D4805B', '#5BAD8A']
const NAMESPACE_BG_COLORS = ['#FFF0E8', '#E8F5E9', '#EBF0FA', '#F3EDF9', '#FFF0E8', '#E8F5E9']

function getNamespaceColor(index) {
  return NAMESPACE_COLORS[index % NAMESPACE_COLORS.length]
}

function getNamespaceBgColor(index) {
  return NAMESPACE_BG_COLORS[index % NAMESPACE_BG_COLORS.length]
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

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCopy({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function IconCheck({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconPencil({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  )
}

function IconTrash({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

function IconChevronDown({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconChevronUp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function IconPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconLink({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

function IconFolderOpen({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      <path d="M2 10h20" />
    </svg>
  )
}

function IconClick({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 4 7.07 17 2.51-7.39L21 11.07z" />
      <path d="m15 15 5 5" />
    </svg>
  )
}

function IconUserPlus({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  )
}

function IconEllipsis({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  )
}

function IconArrowRight({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

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
    <button className={`pp-copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy} title="Copy URL">
      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
    </button>
  )
}

// ─── My Links Card ────────────────────────────────────────────────────────────

function MyLinksSection({ links, onAdd, onEdit, onDelete }) {
  const personalLinks = links ? links.filter(l => !l.namespace) : []
  const customSlugCount = personalLinks.filter(l => l.shortCode && l.shortCode.length > 6).length

  return (
    <div className="pp-card">
      {/* Header */}
      <div className="pp-card-header">
        <div className="pp-card-header-left">
          <span className="pp-card-icon"><IconLink size={18} /></span>
          <span className="pp-card-title">My Links</span>
          <span className="pp-count-badge">{personalLinks.length}</span>
        </div>
        <div className="pp-card-header-right">
          <span className="pp-slug-info">{customSlugCount} of 5 custom slugs used</span>
          <button className="pp-add-btn" onClick={() => onAdd(null, null)}>
            <IconPlus size={12} />
            Add
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="pp-divider" />

      {/* Link List */}
      <div className="pp-link-list">
        {personalLinks.length === 0 ? (
          <div className="pp-empty">No links yet. Create your first short link!</div>
        ) : (
          personalLinks.map((link, i) => {
            const shortUrl = link.namespaceSlug
              ? `${window.location.host}/${link.namespaceSlug}/${link.shortCode}`
              : `${window.location.host}/${link.shortCode}`
            return (
              <div key={link._id}>
                <div className="pp-link-row">
                  <div className="pp-link-info">
                    <div className="pp-link-short-row">
                      <a
                        href={`${window.location.origin}/${link.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pp-link-short-url"
                      >
                        {shortUrl}
                      </a>
                      <CopyButton text={`${window.location.origin}/${link.shortCode}`} />
                    </div>
                    <div className="pp-link-destination">{link.destinationUrl}</div>
                  </div>
                  <div className="pp-link-meta">
                    <span className="pp-clicks">
                      <IconClick size={12} />
                      <span className="pp-clicks-count">{link.clickCount}</span>
                    </span>
                    <button className="pp-icon-btn" onClick={() => onEdit(link)} title="Edit link">
                      <IconPencil size={14} />
                    </button>
                    <button className="pp-icon-btn pp-icon-btn--delete" onClick={() => onDelete(link)} title="Delete link">
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
                {i < personalLinks.length - 1 && <div className="pp-row-divider" />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── All Namespace Links View ─────────────────────────────────────────────────

function AllNamespaceLinksView({ namespaceId, namespaceName, onBack, onEdit, onDelete, onAdd, onInvite }) {
  const [page, setPage] = useState(0)
  const LINKS_PER_PAGE = 5

  const nsLinks = useQuery(api.links.listNamespaceLinks, { namespaceId })
  const members = useQuery(api.collaboration.listMembers, { namespaceId })

  const totalLinks = nsLinks ? nsLinks.length : 0
  const totalPages = Math.max(1, Math.ceil(totalLinks / LINKS_PER_PAGE))
  const pagedLinks = nsLinks ? nsLinks.slice(page * LINKS_PER_PAGE, (page + 1) * LINKS_PER_PAGE) : []
  const memberCount = members ? members.length : 0

  const currentUserMember = members?.find(m => m.isCurrentUser)
  const role = currentUserMember?.role || 'viewer'
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <div className="all-links-view">
      <button className="all-links-back" onClick={onBack}>
        &larr; Back to profile
      </button>

      <div className="all-links-header">
        <div className="namespace-avatar" style={{ background: '#D89575' }}>
          {namespaceName.charAt(0).toUpperCase()}
        </div>
        <span className="namespace-name">{namespaceName}</span>
        <span className="all-links-meta">
          {totalLinks} links &middot; {memberCount} member{memberCount !== 1 ? 's' : ''} &middot; {roleLabel}
        </span>
        <div className="all-links-header-actions">
          <button className="namespace-invite-btn" onClick={() => onInvite(namespaceId, namespaceName)}>
            Invite
          </button>
          <button className="section-add-btn" onClick={() => onAdd(namespaceId, namespaceName)}>
            <IconPlus size={14} /> Add link
          </button>
        </div>
      </div>

      {totalLinks === 0 ? (
        <div className="pp-empty">No links in this namespace yet.</div>
      ) : (
        <>
          <table className="all-links-table">
            <thead>
              <tr>
                <th>Link</th>
                <th>Clicks</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedLinks.map(link => {
                const shortUrl = link.namespaceSlug
                  ? `${window.location.host}/${link.namespaceSlug}/${link.shortCode}`
                  : `${window.location.host}/${link.shortCode}`
                return (
                  <tr key={link._id}>
                    <td>
                      <div className="pp-link-short-row">
                        <a href={`${window.location.origin}/${link.shortCode}`} target="_blank" rel="noopener noreferrer" className="pp-link-short-url">
                          /{link.shortCode}
                        </a>
                        <CopyButton text={`${window.location.origin}/${link.shortCode}`} />
                      </div>
                      <div className="pp-link-destination">{link.destinationUrl}</div>
                    </td>
                    <td>{link.clickCount}</td>
                    <td>{formatDate(link.createdAt)}</td>
                    <td>
                      <div className="pp-link-meta">
                        <button className="pp-icon-btn" onClick={() => onEdit(link)} title="Edit link">
                          <IconPencil size={14} />
                        </button>
                        <button className="pp-icon-btn pp-icon-btn--delete" onClick={() => onDelete(link)} title="Delete link">
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                &lsaquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`page-btn${page === i ? ' active' : ''}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="page-btn" disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}>
                &rsaquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Namespace Card ───────────────────────────────────────────────────────────

function NamespaceSection({ namespace, role, colorIndex, onAdd, onEdit, onDelete, onInvite, onViewAll, onRename, onDeleteNamespace }) {
  const [expanded, setExpanded] = useState(true)
  const [kebabOpen, setKebabOpen] = useState(false)
  const kebabRef = useRef(null)
  const nsLinks = useQuery(api.links.listNamespaceLinks, { namespaceId: namespace._id })
  const members = useQuery(api.collaboration.listMembers, { namespaceId: namespace._id })

  const iconColor = getNamespaceColor(colorIndex)
  const iconBg = getNamespaceBgColor(colorIndex)
  const canEdit = role === 'owner' || role === 'editor'
  const isOwner = role === 'owner'
  const previewLinks = nsLinks ? nsLinks.slice(0, 3) : []
  const totalLinks = nsLinks ? nsLinks.length : 0

  // Close kebab on outside click / escape
  useEffect(() => {
    if (!kebabOpen) return
    function handleClickOutside(e) {
      if (kebabRef.current && !kebabRef.current.contains(e.target)) setKebabOpen(false)
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setKebabOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [kebabOpen])

  function handleEditNamespace() {
    setKebabOpen(false)
    onRename(namespace._id, namespace.slug, namespace.description)
  }

  function handleDeleteNamespace() {
    setKebabOpen(false)
    onDeleteNamespace(namespace._id, namespace.slug)
  }

  // Extract just the slug from a namespaced shortCode ("namespace/slug" → "slug")
  function extractSlug(shortCode, namespaceSlug) {
    if (namespaceSlug && shortCode.startsWith(namespaceSlug + '/')) {
      return shortCode.slice(namespaceSlug.length + 1)
    }
    return shortCode
  }

  return (
    <div className="pp-card">
      {/* Namespace Header */}
      <div className="pp-ns-header">
        <div className="pp-ns-info">
          {/* Folder icon */}
          <div className="pp-ns-folder-icon" style={{ background: iconBg }}>
            <span style={{ color: iconColor }}>
              <IconFolderOpen size={18} />
            </span>
          </div>

          {/* Name + meta */}
          <div className="pp-ns-name-col">
            <span className="pp-ns-name">{namespace.slug}</span>
            <div className="pp-ns-meta-row">
              <span className="pp-ns-link-count">{totalLinks} links</span>
              <span className="pp-ns-dot">·</span>
              <span className={`pp-role-badge pp-role-badge--${role}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="pp-ns-actions">
          {/* Member avatar stack */}
          {members && members.length > 0 && (
            <div className="pp-member-stack">
              {members.slice(0, 4).map((member, i) => (
                <div
                  key={member._id}
                  className="pp-member-avatar"
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
                <div className="pp-member-avatar" style={{ background: '#999' }}>
                  +{members.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Invite (owner only) */}
          {isOwner && (
            <button className="pp-invite-btn" onClick={() => onInvite(namespace._id, namespace.slug)}>
              <IconUserPlus size={13} />
              Invite
            </button>
          )}

          {/* Kebab menu */}
          {isOwner && (
            <div className="pp-kebab" ref={kebabRef}>
              <button
                className="pp-icon-btn"
                title="More options"
                onClick={() => setKebabOpen(o => !o)}
              >
                <IconEllipsis size={16} />
              </button>
              {kebabOpen && (
                <div className="pp-kebab-menu">
                  <button className="pp-kebab-item" onClick={handleEditNamespace}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                    Edit namespace
                  </button>
                  <div className="pp-kebab-divider" />
                  <button className="pp-kebab-item pp-kebab-item--danger" onClick={handleDeleteNamespace}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                    Delete namespace
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Expand/Collapse */}
          <button
            className="pp-icon-btn"
            onClick={() => setExpanded(e => !e)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <>
          <div className="pp-divider" />

          <div className="pp-link-list">
            {previewLinks.length === 0 ? (
              <div className="pp-empty">No links in this namespace yet.</div>
            ) : (
              previewLinks.map((link, i) => {
                const slug = extractSlug(link.shortCode, namespace.slug)
                const fullUrl = `${window.location.origin}/${namespace.slug}/${slug}`
                return (
                  <div key={link._id}>
                    <div className="pp-link-row">
                      <div className="pp-link-info">
                        <div className="pp-link-short-row">
                          <span className="pp-ns-link-slug">/{slug}</span>
                          <CopyButton text={fullUrl} />
                        </div>
                        <div className="pp-link-destination pp-link-destination--ns">
                          {window.location.host}/{namespace.slug}/{slug} → {link.destinationUrl}
                        </div>
                      </div>
                      <div className="pp-link-meta">
                        <span className="pp-clicks">
                          <IconClick size={12} />
                          <span className="pp-clicks-count">{link.clickCount}</span>
                        </span>
                        <span className="pp-link-date">{formatDate(link.createdAt)}</span>
                        {canEdit && (
                          <>
                            <button className="pp-icon-btn" onClick={() => onEdit(link)} title="Edit link">
                              <IconPencil size={14} />
                            </button>
                            <button className="pp-icon-btn pp-icon-btn--delete" onClick={() => onDelete(link)} title="Delete link">
                              <IconTrash size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {i < previewLinks.length - 1 && <div className="pp-row-divider" />}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {(totalLinks > 3 || canEdit) && (
            <>
              <div className="pp-row-divider" />
              <div className="pp-ns-footer">
                <div className="pp-ns-footer-left">
                  {totalLinks > 3 && (
                    <button className="pp-view-all-btn" onClick={() => onViewAll(namespace._id, namespace.slug)}>
                      View all {totalLinks} links
                      <IconArrowRight size={12} />
                    </button>
                  )}
                </div>
                {canEdit && (
                  <button className="pp-add-link-btn" onClick={() => onAdd(namespace._id, namespace.slug)}>
                    <IconPlus size={12} />
                    Add link
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

function ProfilePage() {
  const user = useQuery(api.users.currentUser)
  const stats = useQuery(api.users.getUserStats)
  const myLinks = useQuery(api.links.listMyLinks)
  const namespaces = useQuery(api.namespaces.listMine)

  // Modal states — do not modify
  const [addLinkModal, setAddLinkModal] = useState({ open: false, namespaceId: null, namespaceSlug: null })
  const [editLinkModal, setEditLinkModal] = useState({ open: false, link: null })
  const [deleteLinkModal, setDeleteLinkModal] = useState({ open: false, link: null })
  const [createNamespaceModal, setCreateNamespaceModal] = useState(false)
  const [inviteModal, setInviteModal] = useState({ open: false, namespaceId: null, namespaceName: null })
  const [editProfileModal, setEditProfileModal] = useState(false)
  const [deleteNsModal, setDeleteNsModal] = useState({ open: false, namespaceId: null, namespaceName: null })
  const [renameNsModal, setRenameNsModal] = useState({ open: false, namespaceId: null, namespaceName: null, namespaceDescription: null })
  const [allLinksView, setAllLinksView] = useState({ active: false, namespaceId: null, namespaceName: null })

  if (user === undefined) {
    return (
      <main className="profile-page">
        <div className="profile-loading">Loading...</div>
      </main>
    )
  }

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
      {allLinksView.active ? (
        <AllNamespaceLinksView
          namespaceId={allLinksView.namespaceId}
          namespaceName={allLinksView.namespaceName}
          onBack={() => setAllLinksView({ active: false, namespaceId: null, namespaceName: null })}
          onEdit={(link) => setEditLinkModal({ open: true, link })}
          onDelete={(link) => setDeleteLinkModal({ open: true, link })}
          onAdd={(nsId, nsSlug) => setAddLinkModal({ open: true, namespaceId: nsId, namespaceSlug: nsSlug })}
          onInvite={(nsId, nsName) => setInviteModal({ open: true, namespaceId: nsId, namespaceName: nsName })}
        />
      ) : (
        <div className="pp-body">
          {/* Profile Hero */}
          <div className="pp-hero">
            <div className="pp-hero-left">
              {/* Avatar */}
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="pp-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="pp-avatar pp-avatar--fallback">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* User info */}
              <div className="pp-user-info">
                <div className="pp-user-name-row">
                  <span className="pp-user-name">{displayName}</span>
                  <button className="pp-edit-profile-btn" onClick={() => setEditProfileModal(true)} title="Edit profile">
                    <IconPencil size={14} />
                  </button>
                </div>
                {user.email && <span className="pp-user-email">{user.email}</span>}
                {user.createdAt && <span className="pp-user-since">{formatMemberSince(user.createdAt)}</span>}
              </div>
            </div>

            {/* Stats row */}
            <div className="pp-stats-row">
              <div className="pp-stat-card">
                <span className="pp-stat-number">{stats?.totalLinks ?? 0}</span>
                <span className="pp-stat-label">Links</span>
              </div>
              <div className="pp-stat-card">
                <span className="pp-stat-number">{stats?.totalClicks ?? 0}</span>
                <span className="pp-stat-label">Clicks</span>
              </div>
              <div className="pp-stat-card">
                <span className="pp-stat-number">{stats?.totalNamespaces ?? 0}</span>
                <span className="pp-stat-label">Namespaces</span>
              </div>
            </div>
          </div>

          {/* My Links */}
          <MyLinksSection
            links={myLinks}
            onAdd={(nsId, nsSlug) => setAddLinkModal({ open: true, namespaceId: nsId, namespaceSlug: nsSlug })}
            onEdit={(link) => setEditLinkModal({ open: true, link })}
            onDelete={(link) => setDeleteLinkModal({ open: true, link })}
          />

          {/* Namespace Cards */}
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
              onRename={(nsId, nsName, nsDesc) => setRenameNsModal({ open: true, namespaceId: nsId, namespaceName: nsName, namespaceDescription: nsDesc })}
              onDeleteNamespace={(nsId, nsName) => setDeleteNsModal({ open: true, namespaceId: nsId, namespaceName: nsName })}
            />
          ))}

          {/* Create Namespace */}
          <button className="pp-create-namespace-btn" onClick={() => setCreateNamespaceModal(true)}>
            <IconPlus size={16} />
            Create new namespace
          </button>
        </div>
      )}

      {/* Modals — do not modify */}
      <AddLinkModal
        isOpen={addLinkModal.open}
        onClose={() => setAddLinkModal({ open: false, namespaceId: null, namespaceSlug: null })}
        namespaceId={addLinkModal.namespaceId}
        namespaceSlug={addLinkModal.namespaceSlug}
      />
      <EditLinkModal
        isOpen={editLinkModal.open}
        onClose={() => setEditLinkModal({ open: false, link: null })}
        link={editLinkModal.link}
      />
      <DeleteLinkConfirmModal
        isOpen={deleteLinkModal.open}
        onClose={() => setDeleteLinkModal({ open: false, link: null })}
        link={deleteLinkModal.link}
      />
      <CreateNamespaceModal
        isOpen={createNamespaceModal}
        onClose={() => setCreateNamespaceModal(false)}
      />
      <InviteMemberModal
        isOpen={inviteModal.open}
        onClose={() => setInviteModal({ open: false, namespaceId: null, namespaceName: null })}
        namespaceId={inviteModal.namespaceId}
        namespaceName={inviteModal.namespaceName}
      />
      <EditProfileModal
        isOpen={editProfileModal}
        onClose={() => setEditProfileModal(false)}
        user={user}
      />
      <DeleteNamespaceModal
        isOpen={deleteNsModal.open}
        onClose={() => setDeleteNsModal({ open: false, namespaceId: null, namespaceName: null })}
        namespaceId={deleteNsModal.namespaceId}
        namespaceName={deleteNsModal.namespaceName}
      />
      <RenameNamespaceModal
        isOpen={renameNsModal.open}
        onClose={() => setRenameNsModal({ open: false, namespaceId: null, namespaceName: null, namespaceDescription: null })}
        namespaceId={renameNsModal.namespaceId}
        namespaceName={renameNsModal.namespaceName}
        namespaceDescription={renameNsModal.namespaceDescription}
      />
    </main>
  )
}

export default ProfilePage
