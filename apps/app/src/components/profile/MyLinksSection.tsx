import { useState } from "react";
import { useAction } from "convex/react";
import { useWebHaptics } from "web-haptics/react";
import { MAX_CUSTOM_LINKS } from "../../utils/constants";
import { getAppOrigin, getAppHost } from "../../utils/url-utils";
import {
  IconLink,
  IconPlus,
  IconClick,
  IconPencil,
  IconTrash,
  IconChevronDown,
  IconRefresh,
} from "../common/Icons";
import CopyButton from "./CopyButton";
import { api } from "../../../../../convex/_generated/api";
import { Id, Doc } from "../../../../../convex/_generated/dataModel";

type Link = Doc<"links">;

function RefreshPreviewButton({ linkId }: { linkId: Id<"links"> }) {
  const refreshOg = useAction(api.ogScraper.refreshOgData);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshOg({ linkId });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="pp-icon-btn"
      onClick={handleRefresh}
      disabled={loading}
      title="Refresh link preview"
    >
      <IconRefresh size={14} className={loading ? "spin" : undefined} />
    </button>
  );
}

interface MyLinksSectionProps {
  links: Link[] | undefined;
  onAdd: (namespaceId: null, namespaceSlug: null) => void;
  onEdit: (link: Link) => void;
  onDelete: (link: Link) => void;
  onBulkDelete: (links: Link[]) => void;
}

function MyLinksSection({ links, onAdd, onEdit, onDelete, onBulkDelete }: MyLinksSectionProps) {
  const { trigger } = useWebHaptics();
  const [expanded, setExpanded] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const personalLinks = links ? links.filter((l) => !l.namespace) : [];
  const customSlugCount = personalLinks.filter((l) => !l.autoSlug).length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === personalLinks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(personalLinks.map((l) => String(l._id))));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    const selected = personalLinks.filter((l) => selectedIds.has(String(l._id)));
    onBulkDelete(selected);
  };

  // Auto-exit selection mode when all selected links have been deleted (derived state)
  if (selectionMode && selectedIds.size > 0) {
    const remaining = personalLinks.filter((l) => selectedIds.has(String(l._id)));
    if (remaining.length === 0) {
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  }

  return (
    <div className="pp-card">
      <div className="pp-card-header">
        <div className="pp-card-header-left">
          <span className="pp-card-icon">
            <IconLink size={18} />
          </span>
          <span className="pp-card-title">My Links</span>
          <span className="pp-count-badge">{personalLinks.length}</span>
        </div>
        <div className="pp-card-header-right">
          <span className="pp-slug-info">
            {customSlugCount} of {MAX_CUSTOM_LINKS} custom slugs used
          </span>
          <div className="pp-card-actions-group">
            {personalLinks.length > 0 && (
              <button
                className="pp-text-btn"
                onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
                title={selectionMode ? "Cancel selection" : "Select links"}
              >
                {selectionMode ? "Cancel" : "Select"}
              </button>
            )}
            <button
              className="pp-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                trigger("nudge");
                onAdd(null, null);
              }}
            >
              <IconPlus size={12} />
              Add
            </button>
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
      </div>

      <div className={`pp-collapse${expanded ? " pp-collapse--open" : ""}`}>
        <div className="pp-collapse-inner">
          <div className="pp-divider" />

          {selectionMode && (
            <div className="bulk-toolbar">
              <label className="bulk-select-all">
                <input
                  type="checkbox"
                  checked={selectedIds.size === personalLinks.length && personalLinks.length > 0}
                  onChange={toggleSelectAll}
                />
                Select all
              </label>
              {selectedIds.size > 0 && (
                <>
                  <span className="bulk-count">{selectedIds.size} selected</span>
                  <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          <div className="pp-link-list">
            {personalLinks.length === 0 ? (
              <div className="pp-empty">No links yet. Create your first short link!</div>
            ) : (
              personalLinks.map((link, i) => {
                const shortUrl = link.namespaceSlug
                  ? `${getAppHost()}/${link.namespaceSlug}/${link.shortCode}`
                  : `${getAppHost()}/${link.shortCode}`;
                return (
                  <div key={link._id}>
                    <div className="pp-link-row">
                      {selectionMode && (
                        <input
                          type="checkbox"
                          className="link-select-checkbox"
                          checked={selectedIds.has(String(link._id))}
                          onChange={() => toggleSelect(String(link._id))}
                        />
                      )}
                      <div className="pp-link-info">
                        <div className="pp-link-short-row">
                          <a
                            href={`${getAppOrigin()}/${link.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pp-link-short-url"
                          >
                            {shortUrl}
                          </a>
                          {!link.autoSlug && <span className="pp-custom-badge">custom</span>}
                          <CopyButton text={`${getAppOrigin()}/${link.shortCode}`} />
                        </div>
                        <div className="pp-link-destination">{link.destinationUrl}</div>
                      </div>
                      <div className="pp-link-meta">
                        <span className="pp-clicks">
                          <IconClick size={12} />
                          <span className="pp-clicks-count">{link.clickCount}</span>
                        </span>
                        <RefreshPreviewButton linkId={link._id} />
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
                      </div>
                    </div>
                    {i < personalLinks.length - 1 && <div className="pp-row-divider" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyLinksSection;
