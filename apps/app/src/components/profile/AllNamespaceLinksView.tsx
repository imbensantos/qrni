import { useState } from "react";
import { useQuery } from "convex/react";
import { getAppOrigin } from "../../utils/url-utils";
import { api } from "../../../../../convex/_generated/api";
import { IconPlus, IconPencil, IconTrash } from "../Icons";
import { formatDateShort } from "../../utils/ui-utils";
import CopyButton from "./CopyButton";
import { Id, Doc } from "../../../../../convex/_generated/dataModel";

type Link = Doc<"links">;

interface AllNamespaceLinksViewProps {
  namespaceId: Id<"namespaces">;
  namespaceName: string;
  onBack: () => void;
  onEdit: (link: Link) => void;
  onDelete: (link: Link) => void;
  onAdd: (namespaceId: Id<"namespaces">, namespaceName: string) => void;
  onInvite: (namespaceId: Id<"namespaces">, namespaceName: string) => void;
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
}: AllNamespaceLinksViewProps) {
  const [page, setPage] = useState(0);

  // TODO: This fetches all links client-side then slices for pagination.
  // Should be replaced with server-side pagination (offset/cursor-based query)
  // to avoid fetching the full dataset on every render.
  const nsLinks = useQuery(api.links.listNamespaceLinks, { namespaceId });
  const members = useQuery(api.collaboration.listMembers, { namespaceId });

  const totalLinks = nsLinks ? nsLinks.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalLinks / LINKS_PER_PAGE));
  const pagedLinks = nsLinks
    ? nsLinks.slice(page * LINKS_PER_PAGE, (page + 1) * LINKS_PER_PAGE)
    : [];
  const memberCount = members ? members.length : 0;

  // listMembers does not include isCurrentUser; default to "viewer" for display
  const role = (members?.[0]?.role as string | undefined) ?? "viewer";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="all-links-view">
      <button className="all-links-back" onClick={onBack}>
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
          <button
            className="namespace-invite-btn"
            onClick={() => onInvite(namespaceId, namespaceName)}
          >
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
              {pagedLinks.map((link) => {
                return (
                  <tr key={link._id}>
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
                        <button
                          className="pp-icon-btn"
                          onClick={() => onEdit(link)}
                          title="Edit link"
                        >
                          <IconPencil size={14} />
                        </button>
                        <button
                          className="pp-icon-btn pp-icon-btn--delete"
                          onClick={() => onDelete(link)}
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
                onClick={() => setPage((p) => p - 1)}
              >
                &lsaquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`page-btn${page === i ? " active" : ""}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={page === totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
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
