import { useState, useRef } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useQuery } from "convex/react";
import { getAppOrigin } from "../../utils/url-utils";
import { api } from "../../../../../convex/_generated/api";
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
} from "../Icons";
import { useClickOutside } from "../../hooks/useClickOutside";
import { getColorFromHash, NAMESPACE_COLORS, NAMESPACE_BG_COLORS } from "../../utils/ui-utils";
import { formatDateShort } from "../../utils/ui-utils";
import CopyButton from "./CopyButton";
import { Id, Doc } from "../../../../../convex/_generated/dataModel";

type Namespace = Doc<"namespaces">;
type Link = Doc<"links">;

interface NamespaceSectionProps {
  namespace: Namespace;
  role: "owner" | "editor" | "viewer";
  colorIndex: number;
  onAdd: (namespaceId: Id<"namespaces">, namespaceSlug: string) => void;
  onEdit: (link: Link) => void;
  onDelete: (link: Link) => void;
  onInvite: (namespaceId: Id<"namespaces">, namespaceSlug: string) => void;
  onViewAll: (namespaceId: Id<"namespaces">, namespaceSlug: string) => void;
  onRename: (namespaceId: Id<"namespaces">, slug: string, description: string | undefined) => void;
  onDeleteNamespace: (namespaceId: Id<"namespaces">, slug: string) => void;
}

function extractSlug(shortCode: string, namespaceSlug: string): string {
  if (namespaceSlug && shortCode.startsWith(namespaceSlug + "/")) {
    return shortCode.slice(namespaceSlug.length + 1);
  }
  return shortCode;
}

function NamespaceSection({
  namespace,
  role,
  colorIndex,
  onAdd,
  onEdit,
  onDelete,
  onInvite,
  onViewAll,
  onRename,
  onDeleteNamespace,
}: NamespaceSectionProps) {
  const { trigger } = useWebHaptics();
  const [expanded, setExpanded] = useState(true);
  const [kebabOpen, setKebabOpen] = useState(false);
  const kebabRef = useRef(null);

  const nsLinks = useQuery(api.links.listNamespaceLinks, {
    namespaceId: namespace._id,
  });
  const members = useQuery(api.collaboration.listMembers, {
    namespaceId: namespace._id,
  });

  useClickOutside(kebabRef, () => setKebabOpen(false), kebabOpen);

  const iconColor = getColorFromHash(colorIndex, NAMESPACE_COLORS);
  const iconBg = getColorFromHash(colorIndex, NAMESPACE_BG_COLORS);
  const canEdit = role === "owner" || role === "editor";
  const isOwner = role === "owner";
  const previewLinks = nsLinks ? nsLinks.slice(0, 3) : [];
  const totalLinks = nsLinks ? nsLinks.length : 0;

  function handleEditNamespace() {
    setKebabOpen(false);
    onRename(namespace._id, namespace.slug, namespace.description);
  }

  function handleDeleteNamespace() {
    setKebabOpen(false);
    onDeleteNamespace(namespace._id, namespace.slug);
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
                  style={{
                    background: getColorFromHash(i + 1, NAMESPACE_COLORS),
                  }}
                  title={member.user?.name || "Member"}
                >
                  {/* listMembers does not return image; show initials only */}
                  {(member.user?.name || "?").charAt(0).toUpperCase()}
                </div>
              ))}
              {members.length > 4 && (
                <div className="pp-member-avatar" style={{ background: "#999" }}>
                  +{members.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Invite (owner only, behind feature flag) */}
          {isOwner && import.meta.env.VITE_FEATURE_INVITES === "true" && (
            <button
              className="pp-invite-btn"
              onClick={() => {
                trigger("nudge");
                onInvite(namespace._id, namespace.slug);
              }}
            >
              <IconUserPlus size={13} />
              Invite
            </button>
          )}

          {/* Add link */}
          {canEdit && (
            <button
              className="pp-add-link-btn"
              onClick={() => {
                trigger("nudge");
                onAdd(namespace._id, namespace.slug);
              }}
            >
              <IconPlus size={12} />
              Add link
            </button>
          )}

          {/* Kebab menu */}
          {isOwner && (
            <div className="pp-kebab" ref={kebabRef}>
              <button
                className="pp-icon-btn"
                title="More options"
                onClick={() => {
                  trigger(8);
                  setKebabOpen((o) => !o);
                }}
              >
                <IconEllipsis size={16} />
              </button>
              {kebabOpen && (
                <div className="pp-kebab-menu">
                  <button
                    className="pp-kebab-item"
                    onClick={() => {
                      trigger("nudge");
                      handleEditNamespace();
                    }}
                  >
                    <IconPencil size={16} />
                    Edit namespace
                  </button>
                  <div className="pp-kebab-divider" />
                  <button
                    className="pp-kebab-item pp-kebab-item--danger"
                    onClick={() => {
                      trigger("nudge");
                      handleDeleteNamespace();
                    }}
                  >
                    <IconTrash size={16} />
                    Delete namespace
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Expand/Collapse */}
          <button
            className={`pp-icon-btn pp-chevron-toggle${expanded ? " pp-chevron-toggle--open" : ""}`}
            onClick={() => {
              trigger(8);
              setExpanded((e) => !e);
            }}
            title={expanded ? "Collapse" : "Expand"}
          >
            <IconChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Expandable content */}
      <div className={`pp-collapse${expanded ? " pp-collapse--open" : ""}`}>
        <div className="pp-collapse-inner">
          <div className="pp-divider" />

          <div className="pp-link-list">
            {previewLinks.length === 0 ? (
              <div className="pp-empty">No links in this namespace yet.</div>
            ) : (
              previewLinks.map((link, i) => {
                const slug = extractSlug(link.shortCode, namespace.slug);
                const fullUrl = `${getAppOrigin()}/${namespace.slug}/${slug}`;
                return (
                  <div key={link._id}>
                    <div className="pp-link-row">
                      <div className="pp-link-info">
                        <div className="pp-link-short-row">
                          <span className="pp-ns-link-slug">/{slug}</span>
                          <CopyButton text={fullUrl} />
                        </div>
                        <div className="pp-link-destination">{link.destinationUrl}</div>
                      </div>
                      <div className="pp-link-meta">
                        <span className="pp-clicks">
                          <IconClick size={12} />
                          <span className="pp-clicks-count">{link.clickCount}</span>
                        </span>
                        <span className="pp-link-date">{formatDateShort(link.createdAt)}</span>
                        {canEdit && (
                          <>
                            <button
                              className="pp-icon-btn"
                              onClick={() => {
                                trigger("nudge");
                                onEdit(link);
                              }}
                              title="Edit link"
                            >
                              <IconPencil size={14} />
                            </button>
                            <button
                              className="pp-icon-btn pp-icon-btn--delete"
                              onClick={() => {
                                trigger("nudge");
                                onDelete(link);
                              }}
                              title="Delete link"
                            >
                              <IconTrash size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {i < previewLinks.length - 1 && <div className="pp-row-divider" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {totalLinks > 3 && (
            <>
              <div className="pp-row-divider" />
              <div className="pp-ns-footer">
                <div className="pp-ns-footer-left">
                  <button
                    className="pp-view-all-btn"
                    onClick={() => {
                      trigger("nudge");
                      onViewAll(namespace._id, namespace.slug);
                    }}
                  >
                    View all {totalLinks} links
                    <IconArrowRight size={12} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NamespaceSection;
