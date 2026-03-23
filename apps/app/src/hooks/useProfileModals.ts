import { useState } from "react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

type ShortLink = Doc<"links">;

export interface AddLinkModalState {
  open: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceSlug: string | null;
}

export interface EditLinkModalState {
  open: boolean;
  link: ShortLink | null;
}

export interface DeleteLinkModalState {
  open: boolean;
  link: ShortLink | null;
}

export interface BulkDeleteLinksModalState {
  open: boolean;
  links: ShortLink[];
}

export interface InviteModalState {
  open: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | null;
}

export interface DeleteNsModalState {
  open: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | null;
}

export interface LeaveNsModalState {
  open: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | null;
}

export interface RenameNsModalState {
  open: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | null;
  namespaceDescription: string | null;
}

export interface AllLinksViewState {
  active: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | null;
}

export function useProfileModals() {
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
  const [bulkDeleteLinksModal, setBulkDeleteLinksModal] = useState<BulkDeleteLinksModalState>({
    open: false,
    links: [],
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
  const [leaveNsModal, setLeaveNsModal] = useState<LeaveNsModalState>({
    open: false,
    namespaceId: null,
    namespaceName: null,
  });

  const openAddLink = (nsId: Id<"namespaces"> | null, nsSlug: string | null) =>
    setAddLinkModal({ open: true, namespaceId: nsId, namespaceSlug: nsSlug });

  const closeAddLink = () =>
    setAddLinkModal({ open: false, namespaceId: null, namespaceSlug: null });

  const openEditLink = (link: ShortLink) => setEditLinkModal({ open: true, link });

  const closeEditLink = () => setEditLinkModal({ open: false, link: null });

  const openDeleteLink = (link: ShortLink) => setDeleteLinkModal({ open: true, link });

  const closeDeleteLink = () => setDeleteLinkModal({ open: false, link: null });

  const openBulkDeleteLinks = (links: ShortLink[]) =>
    setBulkDeleteLinksModal({ open: true, links });

  const closeBulkDeleteLinks = () => setBulkDeleteLinksModal({ open: false, links: [] });

  const openCreateNamespace = () => setCreateNamespaceModal(true);
  const closeCreateNamespace = () => setCreateNamespaceModal(false);

  const openInvite = (nsId: Id<"namespaces">, nsName: string) =>
    setInviteModal({ open: true, namespaceId: nsId, namespaceName: nsName });

  const closeInvite = () => setInviteModal({ open: false, namespaceId: null, namespaceName: null });

  const openEditProfile = () => setEditProfileModal(true);
  const closeEditProfile = () => setEditProfileModal(false);

  const openDeleteNs = (nsId: Id<"namespaces">, nsName: string) =>
    setDeleteNsModal({ open: true, namespaceId: nsId, namespaceName: nsName });

  const closeDeleteNs = () =>
    setDeleteNsModal({ open: false, namespaceId: null, namespaceName: null });

  const openRenameNs = (nsId: Id<"namespaces">, nsName: string, nsDesc: string | null) =>
    setRenameNsModal({
      open: true,
      namespaceId: nsId,
      namespaceName: nsName,
      namespaceDescription: nsDesc,
    });

  const closeRenameNs = () =>
    setRenameNsModal({
      open: false,
      namespaceId: null,
      namespaceName: null,
      namespaceDescription: null,
    });

  const openAllLinksView = (nsId: Id<"namespaces">, nsName: string) =>
    setAllLinksView({ active: true, namespaceId: nsId, namespaceName: nsName });

  const closeAllLinksView = () =>
    setAllLinksView({ active: false, namespaceId: null, namespaceName: null });

  const openLeaveNs = (nsId: Id<"namespaces">, nsName: string) =>
    setLeaveNsModal({ open: true, namespaceId: nsId, namespaceName: nsName });

  const closeLeaveNs = () =>
    setLeaveNsModal({ open: false, namespaceId: null, namespaceName: null });

  return {
    // States
    addLinkModal,
    editLinkModal,
    deleteLinkModal,
    bulkDeleteLinksModal,
    createNamespaceModal,
    inviteModal,
    editProfileModal,
    deleteNsModal,
    renameNsModal,
    allLinksView,
    leaveNsModal,

    // Handlers
    openAddLink,
    closeAddLink,
    openEditLink,
    closeEditLink,
    openDeleteLink,
    closeDeleteLink,
    openBulkDeleteLinks,
    closeBulkDeleteLinks,
    openCreateNamespace,
    closeCreateNamespace,
    openInvite,
    closeInvite,
    openEditProfile,
    closeEditProfile,
    openDeleteNs,
    closeDeleteNs,
    openRenameNs,
    closeRenameNs,
    openAllLinksView,
    closeAllLinksView,
    openLeaveNs,
    closeLeaveNs,
  };
}
