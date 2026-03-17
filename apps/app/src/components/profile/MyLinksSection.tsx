import { useState } from "react";
import { MAX_CUSTOM_LINKS } from "../../utils/constants";
import { IconLink, IconPlus, IconClick, IconPencil, IconTrash, IconChevronDown } from "../Icons";
import CopyButton from "./CopyButton";
import { Doc } from "../../../../../convex/_generated/dataModel";

type Link = Doc<"links">;

interface MyLinksSectionProps {
  links: Link[] | undefined;
  onAdd: (namespaceId: null, namespaceSlug: null) => void;
  onEdit: (link: Link) => void;
  onDelete: (link: Link) => void;
}

function MyLinksSection({ links, onAdd, onEdit, onDelete }: MyLinksSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const personalLinks = links ? links.filter((l) => !l.namespace) : [];
  const customSlugCount = personalLinks.filter((l) => !l.autoSlug).length;

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
          <button
            className="pp-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(null, null);
            }}
          >
            <IconPlus size={12} />
            Add
          </button>
          <button
            className={`pp-icon-btn pp-chevron-toggle${expanded ? " pp-chevron-toggle--open" : ""}`}
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? "Collapse" : "Expand"}
          >
            <IconChevronDown size={16} />
          </button>
        </div>
      </div>

      <div className={`pp-collapse${expanded ? " pp-collapse--open" : ""}`}>
        <div className="pp-collapse-inner">
          <div className="pp-divider" />

          <div className="pp-link-list">
            {personalLinks.length === 0 ? (
              <div className="pp-empty">No links yet. Create your first short link!</div>
            ) : (
              personalLinks.map((link, i) => {
                const shortUrl = link.namespaceSlug
                  ? `${window.location.host}/${link.namespaceSlug}/${link.shortCode}`
                  : `${window.location.host}/${link.shortCode}`;
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
                          {!link.autoSlug && <span className="pp-custom-badge">custom</span>}
                          <CopyButton text={`${window.location.origin}/${link.shortCode}`} />
                        </div>
                        <div className="pp-link-destination">{link.destinationUrl}</div>
                      </div>
                      <div className="pp-link-meta">
                        <span className="pp-clicks">
                          <IconClick size={12} />
                          <span className="pp-clicks-count">{link.clickCount}</span>
                        </span>
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
