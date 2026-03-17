import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cleanConvexError } from "../utils/errors";

interface Namespace {
  _id: Id<"namespaces">;
  slug: string;
}

interface NamespaceDropdownProps {
  allNamespaces: Namespace[];
  ownedNamespacesCount: number;
  selectedNamespace: Namespace | null;
  onNamespaceSelect: (ns: Namespace | null) => void;
  onNamespaceCreated: (nsId: Id<"namespaces">) => void;
}

function NamespaceDropdown({
  allNamespaces,
  ownedNamespacesCount,
  selectedNamespace,
  onNamespaceSelect,
  onNamespaceCreated,
}: NamespaceDropdownProps) {
  const [nsDropdownOpen, setNsDropdownOpen] = useState(false);
  const [nsFocusedIndex, setNsFocusedIndex] = useState(0);
  const [creatingNs, setCreatingNs] = useState(false);
  const [newNsSlug, setNewNsSlug] = useState("");
  const [nsCreateError, setNsCreateError] = useState<string | null>(null);

  const createNamespace = useMutation(api.namespaces.create);

  const handleCreateNamespace = async () => {
    if (!newNsSlug.trim()) return;
    setNsCreateError(null);
    try {
      const nsId = await createNamespace({
        slug: newNsSlug.trim().toLowerCase(),
      });
      onNamespaceCreated(nsId);
      setNewNsSlug("");
      setCreatingNs(false);
      setNsDropdownOpen(false);
    } catch (err) {
      const msg = cleanConvexError((err as Error).message);
      setNsCreateError(msg || "Failed to create namespace");
    }
  };

  const handleSelect = (value: string) => {
    setNsDropdownOpen(false);
    if (value === "none") {
      onNamespaceSelect(null);
      return;
    }
    const ns = allNamespaces.find((n) => n._id === value);
    onNamespaceSelect(ns ?? null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const optionCount = 1 + allNamespaces.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setNsFocusedIndex((i) => Math.min(i + 1, optionCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setNsFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (nsFocusedIndex === 0) handleSelect("none");
      else handleSelect(allNamespaces[nsFocusedIndex - 1]._id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setNsDropdownOpen(false);
    }
  };

  return (
    <section className="control-section" role="group" aria-labelledby="namespace-label">
      <label id="namespace-label" className="control-label">
        Namespace
      </label>
      <div className="namespace-dropdown-wrapper">
        <button
          type="button"
          className="namespace-dropdown-trigger"
          onClick={() => {
            setNsDropdownOpen(!nsDropdownOpen);
            setNsFocusedIndex(0);
          }}
          aria-expanded={nsDropdownOpen}
          aria-haspopup="listbox"
        >
          <span style={selectedNamespace ? undefined : { color: "var(--text-tertiary)" }}>
            {selectedNamespace ? selectedNamespace.slug : "None"}
          </span>
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            className={`ns-chevron ${nsDropdownOpen ? "open" : ""}`}
          >
            <path
              d="M1 1L6 6L11 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {nsDropdownOpen && (
          <ul
            className="namespace-dropdown-menu"
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
          >
            <li
              role="option"
              aria-selected={!selectedNamespace}
              className={`ns-option ${!selectedNamespace ? "selected" : ""} ${nsFocusedIndex === 0 ? "focused" : ""}`}
              onClick={() => handleSelect("none")}
            >
              None
            </li>
            {allNamespaces.map((ns, idx) => (
              <li
                key={ns._id}
                role="option"
                aria-selected={selectedNamespace?._id === ns._id}
                className={`ns-option ${selectedNamespace?._id === ns._id ? "selected" : ""} ${nsFocusedIndex === idx + 1 ? "focused" : ""}`}
                onClick={() => handleSelect(ns._id)}
              >
                {ns.slug}
              </li>
            ))}
            <li className="ns-option ns-create-option">
              {creatingNs ? (
                <div className="ns-create-form" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    className="ns-create-input"
                    placeholder="my-namespace"
                    value={newNsSlug}
                    onChange={(e) => setNewNsSlug(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateNamespace();
                      if (e.key === "Escape") {
                        setCreatingNs(false);
                        setNsCreateError(null);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="ns-create-confirm"
                    onClick={handleCreateNamespace}
                  >
                    Add
                  </button>
                </div>
              ) : ownedNamespacesCount >= 5 ? (
                <span className="ns-limit-msg">Namespace limit reached (5 of 5)</span>
              ) : (
                <button
                  type="button"
                  className="ns-create-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingNs(true);
                    setNsCreateError(null);
                  }}
                >
                  + Create namespace
                </button>
              )}
              {nsCreateError && (
                <p className="shortlink-error" style={{ marginTop: 4 }}>
                  {nsCreateError}
                </p>
              )}
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}

export default NamespaceDropdown;
