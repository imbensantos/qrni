import { useQuery, usePaginatedQuery } from "convex/react";
import { Link } from "@tanstack/react-router";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import AddLinkModal from "../components/modals/AddLinkModal";
import EditLinkModal from "../components/modals/EditLinkModal";
import DeleteLinkConfirmModal from "../components/modals/DeleteLinkConfirmModal";
import CreateNamespaceModal from "../components/modals/CreateNamespaceModal";
import InviteMemberModal from "../components/modals/InviteMemberModal";
import EditProfileModal from "../components/modals/EditProfileModal";
import DeleteNamespaceModal from "../components/modals/DeleteNamespaceModal";
import RenameNamespaceModal from "../components/modals/RenameNamespaceModal";
import LeaveNamespaceModal from "../components/modals/LeaveNamespaceModal";
import { useWebHaptics } from "web-haptics/react";
import { IconPencil, IconPlus } from "../components/Icons";
import MyLinksSection from "../components/profile/MyLinksSection";
import AllNamespaceLinksView from "../components/profile/AllNamespaceLinksView";
import NamespaceSection from "../components/profile/NamespaceSection";
import AdSlot from "../components/AdSlot";
import AppFooter from "../components/AppFooter";
import { formatMemberSince } from "../utils/ui-utils";
import { MAX_NAMESPACES_PER_USER } from "../../../../convex/lib/constants";
import { useProfileModals } from "../hooks/useProfileModals";
import "./ProfilePage.css";

type NamespaceRole = "owner" | "editor" | "viewer";

function ProfileLoadingSkeleton() {
  return (
    <main className="profile-page">
      <div className="profile-loading">
        <div className="skeleton-container">
          <div className="skeleton-row">
            <div className="skeleton skeleton-avatar" />
            <div className="skeleton-col">
              <div className="skeleton skeleton-text skeleton-text--name" />
              <div className="skeleton skeleton-text skeleton-text--email" />
            </div>
          </div>
          <div className="skeleton-stats">
            <div className="skeleton skeleton-stat" />
            <div className="skeleton skeleton-stat" />
            <div className="skeleton skeleton-stat" />
          </div>
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card skeleton-card--short" />
        </div>
      </div>
    </main>
  );
}

function ProfilePage() {
  const user = useQuery(api.users.currentUser);
  const stats = useQuery(api.users.getUserStats);
  const { results: myLinks } = usePaginatedQuery(
    api.links.listMyLinks,
    {},
    { initialNumItems: 500 },
  );
  const namespaces = useQuery(api.namespaces.listMine);

  const { trigger } = useWebHaptics();
  const modals = useProfileModals();

  const modalHandlers = {
    onAdd: modals.openAddLink,
    onEdit: modals.openEditLink,
    onDelete: modals.openDeleteLink,
    onInvite: modals.openInvite,
    onLeave: modals.openLeaveNs,
  };

  if (user === undefined) {
    return <ProfileLoadingSkeleton />;
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

  const ownedWithRole: NamespaceWithRole[] = (namespaces?.owned || []).map((ns) => ({
    ...ns,
    role: "owner" as const,
  }));

  // collaborated items from Convex may include null (Promise.all results) — filter them out
  const collaboratedWithRole = (namespaces?.collaborated || []).flatMap((ns) =>
    ns !== null ? [ns as NamespaceWithRole] : [],
  );

  const allNamespaces: NamespaceWithRole[] = [...ownedWithRole, ...collaboratedWithRole];

  return (
    <main className="profile-page">
      {modals.allLinksView.active &&
      modals.allLinksView.namespaceId &&
      modals.allLinksView.namespaceName ? (
        <AllNamespaceLinksView
          namespaceId={modals.allLinksView.namespaceId}
          namespaceName={modals.allLinksView.namespaceName}
          onBack={modals.closeAllLinksView}
          onEdit={modalHandlers.onEdit}
          onDelete={modalHandlers.onDelete}
          onAdd={modalHandlers.onAdd}
          onInvite={modalHandlers.onInvite}
        />
      ) : (
        <>
          <AdSlot
            slot="PROFILE_PILLAR_LEFT_SLOT_ID"
            format="vertical"
            responsive={false}
            className="ad-slot--pillar ad-slot--pillar-left"
          />
          <AdSlot
            slot="PROFILE_PILLAR_RIGHT_SLOT_ID"
            format="vertical"
            responsive={false}
            className="ad-slot--pillar ad-slot--pillar-right"
          />
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
                      onClick={() => {
                        trigger("nudge");
                        modals.openEditProfile();
                      }}
                      title="Edit profile"
                    >
                      <IconPencil size={14} />
                    </button>
                  </div>
                  {user.email && <span className="pp-user-email">{user.email}</span>}
                  {user.createdAt && (
                    <span className="pp-user-since">{formatMemberSince(user.createdAt)}</span>
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
              onAdd={modalHandlers.onAdd}
              onEdit={modalHandlers.onEdit}
              onDelete={modalHandlers.onDelete}
            />

            <AdSlot
              slot="PROFILE_INFEED_SLOT_ID"
              format="horizontal"
              className="ad-slot--profile-infeed"
            />

            {/* Namespace header */}
            <div className="pp-namespace-header">
              <span className="pp-card-title">Namespaces</span>
              <span className="pp-slug-info">
                {ownedWithRole.length} of {MAX_NAMESPACES_PER_USER} namespaces used
              </span>
            </div>

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
                onLeave={modalHandlers.onLeave}
                onViewAll={(nsId, nsName) => modals.openAllLinksView(nsId, nsName)}
                onRename={(nsId, nsName, nsDesc) =>
                  modals.openRenameNs(nsId, nsName, nsDesc ?? null)
                }
                onDeleteNamespace={(nsId, nsName) => modals.openDeleteNs(nsId, nsName)}
              />
            ))}

            {/* Create Namespace */}
            <button
              className="pp-create-namespace-btn"
              onClick={() => {
                trigger("nudge");
                modals.openCreateNamespace();
              }}
              disabled={ownedWithRole.length >= MAX_NAMESPACES_PER_USER}
            >
              <IconPlus size={16} />
              Create new namespace
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      <AddLinkModal
        isOpen={modals.addLinkModal.open}
        onClose={modals.closeAddLink}
        namespaceId={modals.addLinkModal.namespaceId}
        namespaceSlug={modals.addLinkModal.namespaceSlug}
      />
      <EditLinkModal
        isOpen={modals.editLinkModal.open}
        onClose={modals.closeEditLink}
        link={modals.editLinkModal.link}
      />
      <DeleteLinkConfirmModal
        isOpen={modals.deleteLinkModal.open}
        onClose={modals.closeDeleteLink}
        link={modals.deleteLinkModal.link}
      />
      <CreateNamespaceModal
        isOpen={modals.createNamespaceModal}
        onClose={modals.closeCreateNamespace}
      />
      <InviteMemberModal
        isOpen={modals.inviteModal.open}
        onClose={modals.closeInvite}
        namespaceId={modals.inviteModal.namespaceId}
        namespaceName={modals.inviteModal.namespaceName ?? ""}
      />
      <EditProfileModal
        isOpen={modals.editProfileModal}
        onClose={modals.closeEditProfile}
        user={user}
      />
      <DeleteNamespaceModal
        isOpen={modals.deleteNsModal.open}
        onClose={modals.closeDeleteNs}
        namespaceId={modals.deleteNsModal.namespaceId}
        namespaceName={modals.deleteNsModal.namespaceName ?? undefined}
      />
      <RenameNamespaceModal
        isOpen={modals.renameNsModal.open}
        onClose={modals.closeRenameNs}
        namespaceId={modals.renameNsModal.namespaceId}
        namespaceName={modals.renameNsModal.namespaceName ?? undefined}
        namespaceDescription={modals.renameNsModal.namespaceDescription ?? undefined}
      />
      <LeaveNamespaceModal
        isOpen={modals.leaveNsModal.open}
        onClose={modals.closeLeaveNs}
        namespaceId={modals.leaveNsModal.namespaceId}
        namespaceName={modals.leaveNsModal.namespaceName ?? ""}
      />

      <div className="profile-page-bottom">
        <AdSlot
          slot="PROFILE_FOOTER_SLOT_ID"
          format="horizontal"
          className="ad-slot--profile-footer"
        />
        <AppFooter className="profile-page-footer" />
      </div>
    </main>
  );
}

export default ProfilePage;
