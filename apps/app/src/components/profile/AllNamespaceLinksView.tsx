import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useQuery, useAction } from "convex/react";
import { useSelectionMode } from "../../hooks/useSelectionMode";
import { getAppOrigin } from "../../utils/url-utils";
import { api } from "../../../../../convex/_generated/api";
import { IconPlus, IconPencil, IconTrash, IconRefresh } from "../common/Icons";
import { formatDateShort } from "../../utils/ui-utils";
import CopyButton from "./CopyButton";
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

interface AllNamespaceLinksViewProps {
  namespaceId: Id<"namespaces">;
  namespaceName: string;
  onBack: () => void;
  onEdit: (link: Link) => void;
  onDelete: (link: Link) => void;
  onAdd: (namespaceId: Id<"namespaces">, namespaceName: string) => void;
  onInvite: (namespaceId: Id<"namespaces">, namespaceName: string) => void;
  onBulkDelete: (links: Link[]) => void;
}

const LINKS_PER_PAGE = 5;

function AllNamespaceLinksView({
  namespaceId,
  namespaceName,
  onBack,
  onEdit,
  onDelete,
  onAdd,
  onInvite,
  onBulkDelete,
}: AllNamespaceLinksViewProps) {
  const { trigger } = useWebHaptics();
  const [page, setPage] = useState(0);

  // TODO: This fetches all links client-side then slices for pagination.
  // Should be replaced with server-side pagination (offset/cursor-based query)
  // to avoid fetching the full dataset on every render.
  const nsLinks = useQuery(api.links.listNamespaceLinks, { namespaceId }) ?? [];
  const members = useQuery(api.collaboration.listMembers, { namespaceId });
  const currentUser = useQuery(api.users.currentUser);

  const totalLinks = nsLinks.length;
  const totalPages = Math.max(1, Math.ceil(totalLinks / LINKS_PER_PAGE));
  const pagedLinks = nsLinks.slice(page * LINKS_PER_PAGE, (page + 1) * LINKS_PER_PAGE);
  const memberCount = members ? members.length : 0;

  const {
    selectionMode,
    selectedIds,
    enterSelectionMode,
    toggleSelect,
    toggleSelectAll,
    exitSelectionMode,
    handleBulkDelete,
  } = useSelectionMode({ items: nsLinks, selectableItems: pagedLinks, onBulkDelete });

  const currentMember = members?.find((m) => m.user?._id === currentUser?._id);
  const role = currentMember?.role ?? "viewer";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="all-links-view">
      <button
        className="all-links-back"
        onClick={() => {
          trigger("nudge");
          onBack();
        }}
      >
        &larr; Back to profile
      </button>

      <div className="all-links-header">
        <div className="namespace-avatar" style={{ background: "#D89575" }}>
          {namespaceName.charAt(0).toUpperCase()}
        </div>
        <span className="namespace-name">{namespaceName}</span>
        <span className="all-links-meta">
          {totalLinks} links &middot; {memberCount} member
          {memberCount !== 1 ? "s" : ""} &middot; {roleLabel}
        </span>
        <div className="all-links-header-actions">
          {nsLinks.length > 0 && (
            <button
              className="pp-text-btn"
              onClick={() => (selectionMode ? exitSelectionMode() : enterSelectionMode())}
            >
              {selectionMode ? "Cancel" : "Select"}
            </button>
          )}
          <button
            className="namespace-invite-btn"
            onClick={() => {
              trigger("nudge");
              onInvite(namespaceId, namespaceName);
            }}
          >
            Invite
          </button>
          <button
            className="section-add-btn"
            onClick={() => {
              trigger("nudge");
              onAdd(namespaceId, namespaceName);
            }}
          >
            <IconPlus size={14} /> Add link
          </button>
        </div>
      </div>

      {totalLinks === 0 ? (
        <div className="pp-empty">No links in this namespace yet.</div>
      ) : (
        <>
          {selectionMode && (
            <div className="bulk-toolbar">
              <label className="bulk-select-all">
                <input
                  type="checkbox"
                  checked={
                    pagedLinks.length > 0 && pagedLinks.every((l) => selectedIds.has(String(l._id)))
                  }
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

          <table className="all-links-table">
            <thead>
              <tr>
                {selectionMode && <th style={{ width: "32px" }}></th>}
                <th scope="col">Link</th>
                <th scope="col">Clicks</th>
                <th scope="col">Created</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedLinks.map((link) => {
                return (
                  <tr key={link._id}>
                    {selectionMode && (
                      <td>
                        <input
                          type="checkbox"
                          className="link-select-checkbox"
                          checked={selectedIds.has(String(link._id))}
                          onChange={() => toggleSelect(String(link._id))}
                        />
                      </td>
                    )}
                    <td>
                      <div className="pp-link-short-row">
                        <a
                          href={`${getAppOrigin()}/${link.shortCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pp-link-short-url"
                        >
                          /{link.shortCode}
                        </a>
                        <CopyButton text={`${getAppOrigin()}/${link.shortCode}`} />
                      </div>
                      <div className="pp-link-destination">{link.destinationUrl}</div>
                    </td>
                    <td>{link.clickCount}</td>
                    <td>{formatDateShort(link.createdAt)}</td>
                    <td>
                      <div className="pp-link-meta">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page === 0}
                onClick={() => {
                  trigger(8);
                  setPage((p) => p - 1);
                }}
              >
                &lsaquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`page-btn${page === i ? " active" : ""}`}
                  onClick={() => {
                    trigger(8);
                    setPage(i);
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={page === totalPages - 1}
                onClick={() => {
                  trigger(8);
                  setPage((p) => p + 1);
                }}
              >
                &rsaquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AllNamespaceLinksView;
