import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "@tanstack/react-router";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import AddLinkModal from "../components/modals/AddLinkModal";
import EditLinkModal from "../components/modals/EditLinkModal";
import DeleteLinkConfirmModal from "../components/modals/DeleteLinkConfirmModal";
import CreateNamespaceModal from "../components/modals/CreateNamespaceModal";
import InviteMemberModal from "../components/modals/InviteMemberModal";
import EditProfileModal from "../components/modals/EditProfileModal";
import DeleteNamespaceModal from "../components/modals/DeleteNamespaceModal";
import RenameNamespaceModal from "../components/modals/RenameNamespaceModal";
import { IconPencil, IconPlus } from "../components/Icons";
import MyLinksSection from "../components/profile/MyLinksSection";
import AllNamespaceLinksView from "../components/profile/AllNamespaceLinksView";
import NamespaceSection from "../components/profile/NamespaceSection";
import { formatMemberSince } from "../utils/ui-utils";
import "./ProfilePage.css";

type ShortLink = Doc<"links">;
type NamespaceRole = "owner" | "editor" | "viewer";

interface AddLinkModalState {
  open: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceSlug: string | null;
}

interface EditLinkModalState {
  open: boolean;
  link: ShortLink | null;
}

interface DeleteLinkModalState {
  open: boolean;
  link: ShortLink | null;
}

interface InviteModalState {
  open: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | null;
}

interface DeleteNsModalState {
  open: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | null;
}

interface RenameNsModalState {
  open: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | null;
  namespaceDescription: string | null;
}

interface AllLinksViewState {
  active: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | null;
}

function ProfilePage() {
  const user = useQuery(api.users.currentUser);
  const stats = useQuery(api.users.getUserStats);
  const myLinks = useQuery(api.links.listMyLinks);
  const namespaces = useQuery(api.namespaces.listMine);

  // Modal states — do not modify
  const [addLinkModal, setAddLinkModal] = useState<AddLinkModalState>({
    open: false,
    namespaceId: null,
    namespaceSlug: null,
  });
  const [editLinkModal, setEditLinkModal] = useState<EditLinkModalState>({
    open: false,
    link: null,
  });
  const [deleteLinkModal, setDeleteLinkModal] = useState<DeleteLinkModalState>({
    open: false,
    link: null,
  });
  const [createNamespaceModal, setCreateNamespaceModal] = useState(false);
  const [inviteModal, setInviteModal] = useState<InviteModalState>({
    open: false,
    namespaceId: null,
    namespaceName: null,
  });
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [deleteNsModal, setDeleteNsModal] = useState<DeleteNsModalState>({
    open: false,
    namespaceId: null,
    namespaceName: null,
  });
  const [renameNsModal, setRenameNsModal] = useState<RenameNsModalState>({
    open: false,
    namespaceId: null,
    namespaceName: null,
    namespaceDescription: null,
  });
  const [allLinksView, setAllLinksView] = useState<AllLinksViewState>({
    active: false,
    namespaceId: null,
    namespaceName: null,
  });

  if (user === undefined) {
    return (
      <main className="profile-page">
        <div className="profile-loading">Loading...</div>
      </main>
    );
  }

  if (user === null) {
    return (
      <main className="profile-page">
        <div className="profile-auth-guard">
          <p>Sign in to view your profile</p>
          <Link to="/">Back to home</Link>
        </div>
      </main>
    );
  }

  const avatarUrl = user.image || user.avatarUrl;
  const displayName = user.name || "User";
  type NamespaceWithRole = Doc<"namespaces"> & { role: NamespaceRole };

  const ownedWithRole: NamespaceWithRole[] = (namespaces?.owned || []).map(
    (ns) => ({ ...ns, role: "owner" as const }),
  );

  // collaborated items from Convex may include null (Promise.all results) — filter them out
  const collaboratedWithRole = (namespaces?.collaborated || []).flatMap((ns) =>
    ns !== null ? [ns as NamespaceWithRole] : [],
  );

  const allNamespaces: NamespaceWithRole[] = [
    ...ownedWithRole,
    ...collaboratedWithRole,
  ];

  const modalHandlers = {
    onAdd: (nsId: Id<"namespaces"> | null, nsSlug: string | null) =>
      setAddLinkModal({ open: true, namespaceId: nsId, namespaceSlug: nsSlug }),
    onEdit: (link: ShortLink) => setEditLinkModal({ open: true, link }),
    onDelete: (link: ShortLink) => setDeleteLinkModal({ open: true, link }),
    onInvite: (nsId: Id<"namespaces">, nsName: string) =>
      setInviteModal({ open: true, namespaceId: nsId, namespaceName: nsName }),
  };

  return (
    <main className="profile-page">
      {allLinksView.active &&
      allLinksView.namespaceId &&
      allLinksView.namespaceName ? (
        <AllNamespaceLinksView
          namespaceId={allLinksView.namespaceId}
          namespaceName={allLinksView.namespaceName}
          onBack={() =>
            setAllLinksView({
              active: false,
              namespaceId: null,
              namespaceName: null,
            })
          }
          onEdit={modalHandlers.onEdit}
          onDelete={modalHandlers.onDelete}
          onAdd={modalHandlers.onAdd}
          onInvite={modalHandlers.onInvite}
        />
      ) : (
        <div className="pp-body">
          {/* Profile Hero */}
          <div className="pp-hero">
            <div className="pp-hero-left">
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

              <div className="pp-user-info">
                <div className="pp-user-name-row">
                  <span className="pp-user-name">{displayName}</span>
                  <button
                    className="pp-edit-profile-btn"
                    onClick={() => setEditProfileModal(true)}
                    title="Edit profile"
                  >
                    <IconPencil size={14} />
                  </button>
                </div>
                {user.email && (
                  <span className="pp-user-email">{user.email}</span>
                )}
                {user.createdAt && (
                  <span className="pp-user-since">
                    {formatMemberSince(user.createdAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="pp-stats-row">
              <div className="pp-stat-card">
                <span className="pp-stat-number">{stats?.totalLinks ?? 0}</span>
                <span className="pp-stat-label">Links</span>
              </div>
              <div className="pp-stat-card">
                <span className="pp-stat-number">
                  {stats?.totalClicks ?? 0}
                </span>
                <span className="pp-stat-label">Clicks</span>
              </div>
              <div className="pp-stat-card">
                <span className="pp-stat-number">
                  {stats?.totalNamespaces ?? 0}
                </span>
                <span className="pp-stat-label">Namespaces</span>
              </div>
            </div>
          </div>

          {/* My Links */}
          <MyLinksSection
            links={myLinks}
            onAdd={modalHandlers.onAdd}
            onEdit={modalHandlers.onEdit}
            onDelete={modalHandlers.onDelete}
          />

          {/* Namespace Cards */}
          {allNamespaces.map((ns, index) => (
            <NamespaceSection
              key={ns._id}
              namespace={ns}
              role={ns.role}
              colorIndex={index}
              onAdd={modalHandlers.onAdd}
              onEdit={modalHandlers.onEdit}
              onDelete={modalHandlers.onDelete}
              onInvite={modalHandlers.onInvite}
              onViewAll={(nsId, nsName) =>
                setAllLinksView({
                  active: true,
                  namespaceId: nsId,
                  namespaceName: nsName,
                })
              }
              onRename={(nsId, nsName, nsDesc) =>
                setRenameNsModal({
                  open: true,
                  namespaceId: nsId,
                  namespaceName: nsName,
                  namespaceDescription: nsDesc ?? null,
                })
              }
              onDeleteNamespace={(nsId, nsName) =>
                setDeleteNsModal({
                  open: true,
                  namespaceId: nsId,
                  namespaceName: nsName,
                })
              }
            />
          ))}

          {/* Create Namespace */}
          <button
            className="pp-create-namespace-btn"
            onClick={() => setCreateNamespaceModal(true)}
          >
            <IconPlus size={16} />
            Create new namespace
          </button>
        </div>
      )}

      {/* Modals — do not modify */}
      <AddLinkModal
        isOpen={addLinkModal.open}
        onClose={() =>
          setAddLinkModal({
            open: false,
            namespaceId: null,
            namespaceSlug: null,
          })
        }
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
        onClose={() =>
          setInviteModal({
            open: false,
            namespaceId: null,
            namespaceName: null,
          })
        }
        namespaceId={inviteModal.namespaceId}
        namespaceName={inviteModal.namespaceName ?? ""}
      />
      <EditProfileModal
        isOpen={editProfileModal}
        onClose={() => setEditProfileModal(false)}
        user={user}
      />
      <DeleteNamespaceModal
        isOpen={deleteNsModal.open}
        onClose={() =>
          setDeleteNsModal({
            open: false,
            namespaceId: null,
            namespaceName: null,
          })
        }
        namespaceId={deleteNsModal.namespaceId}
        namespaceName={deleteNsModal.namespaceName ?? undefined}
      />
      <RenameNamespaceModal
        isOpen={renameNsModal.open}
        onClose={() =>
          setRenameNsModal({
            open: false,
            namespaceId: null,
            namespaceName: null,
            namespaceDescription: null,
          })
        }
        namespaceId={renameNsModal.namespaceId}
        namespaceName={renameNsModal.namespaceName ?? undefined}
        namespaceDescription={renameNsModal.namespaceDescription ?? undefined}
      />
    </main>
  );
}

export default ProfilePage;
