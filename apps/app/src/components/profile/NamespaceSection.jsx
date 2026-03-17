import { useState, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import {
  IconPencil,
  IconTrash,
  IconChevronDown,
  IconPlus,
  IconFolderOpen,
  IconClick,
  IconUserPlus,
  IconEllipsis,
  IconArrowRight,
} from '../Icons'
import { useClickOutside } from '../../hooks/useClickOutside'
import { getColorFromHash, NAMESPACE_COLORS, NAMESPACE_BG_COLORS } from '../../utils/ui-utils'
import { formatDateShort } from '../../utils/ui-utils'
import CopyButton from './CopyButton'

function extractSlug(shortCode, namespaceSlug) {
  if (namespaceSlug && shortCode.startsWith(namespaceSlug + '/')) {
    return shortCode.slice(namespaceSlug.length + 1)
  }
  return shortCode
}

function NamespaceSection({ namespace, role, colorIndex, onAdd, onEdit, onDelete, onInvite, onViewAll, onRename, onDeleteNamespace }) {
  const [expanded, setExpanded] = useState(true)
  const [kebabOpen, setKebabOpen] = useState(false)
  const kebabRef = useRef(null)

  const nsLinks = useQuery(api.links.listNamespaceLinks, { namespaceId: namespace._id })
  const members = useQuery(api.collaboration.listMembers, { namespaceId: namespace._id })

  useClickOutside(kebabRef, () => setKebabOpen(false), kebabOpen)

  const iconColor = getColorFromHash(colorIndex, NAMESPACE_COLORS)
  const iconBg = getColorFromHash(colorIndex, NAMESPACE_BG_COLORS)
  const canEdit = role === 'owner' || role === 'editor'
  const isOwner = role === 'owner'
  const previewLinks = nsLinks ? nsLinks.slice(0, 3) : []
  const totalLinks = nsLinks ? nsLinks.length : 0

  function handleEditNamespace() {
    setKebabOpen(false)
    onRename(namespace._id, namespace.slug, namespace.description)
  }

  function handleDeleteNamespace() {
    setKebabOpen(false)
    onDeleteNamespace(namespace._id, namespace.slug)
  }

  return (
    <div className="pp-card">
      {/* Namespace Header */}
      <div className="pp-ns-header">
        <div className="pp-ns-info">
          <div className="pp-ns-folder-icon" style={{ background: iconBg }}>
            <span style={{ color: iconColor }}>
              <IconFolderOpen size={18} />
            </span>
          </div>

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
                  style={{ background: getColorFromHash(i + 1, NAMESPACE_COLORS) }}
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
                    <IconPencil size={16} />
                    Edit namespace
                  </button>
                  <div className="pp-kebab-divider" />
                  <button className="pp-kebab-item pp-kebab-item--danger" onClick={handleDeleteNamespace}>
                    <IconTrash size={16} />
                    Delete namespace
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Expand/Collapse */}
          <button
            className={`pp-icon-btn pp-chevron-toggle${expanded ? ' pp-chevron-toggle--open' : ''}`}
            onClick={() => setExpanded(e => !e)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            <IconChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Expandable content */}
      <div className={`pp-collapse${expanded ? ' pp-collapse--open' : ''}`}>
        <div className="pp-collapse-inner">
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
                        <span className="pp-link-date">{formatDateShort(link.createdAt)}</span>
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
        </div>
      </div>
    </div>
  )
}

export default NamespaceSection
