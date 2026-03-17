import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProfileModals } from "./useProfileModals";
import type { Id } from "../../../../convex/_generated/dataModel";

// Fake IDs typed to satisfy the Convex branded type
const FAKE_NS_ID = "ns_abc123" as Id<"namespaces">;
const FAKE_LINK = {
  _id: "link_xyz" as Id<"links">,
  _creationTime: Date.now(),
  userId: "user_1",
  url: "https://example.com",
  slug: "abc",
  clicks: 0,
} as any;  

describe("useProfileModals", () => {
  it("all modals start closed", () => {
    const { result } = renderHook(() => useProfileModals());
    expect(result.current.addLinkModal.open).toBe(false);
    expect(result.current.editLinkModal.open).toBe(false);
    expect(result.current.deleteLinkModal.open).toBe(false);
    expect(result.current.createNamespaceModal).toBe(false);
    expect(result.current.inviteModal.open).toBe(false);
    expect(result.current.editProfileModal).toBe(false);
    expect(result.current.deleteNsModal.open).toBe(false);
    expect(result.current.renameNsModal.open).toBe(false);
    expect(result.current.allLinksView.active).toBe(false);
  });

  // --- Add Link ---
  it("openAddLink sets modal open with namespaceId and slug", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openAddLink(FAKE_NS_ID, "my-ns"));
    expect(result.current.addLinkModal).toEqual({
      open: true,
      namespaceId: FAKE_NS_ID,
      namespaceSlug: "my-ns",
    });
  });

  it("closeAddLink resets to closed", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openAddLink(FAKE_NS_ID, "slug"));
    act(() => result.current.closeAddLink());
    expect(result.current.addLinkModal.open).toBe(false);
    expect(result.current.addLinkModal.namespaceId).toBeNull();
  });

  // --- Edit Link ---
  it("openEditLink sets modal with link data", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openEditLink(FAKE_LINK));
    expect(result.current.editLinkModal.open).toBe(true);
    expect(result.current.editLinkModal.link).toBe(FAKE_LINK);
  });

  it("closeEditLink resets", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openEditLink(FAKE_LINK));
    act(() => result.current.closeEditLink());
    expect(result.current.editLinkModal.open).toBe(false);
    expect(result.current.editLinkModal.link).toBeNull();
  });

  // --- Delete Link ---
  it("openDeleteLink sets modal with link data", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openDeleteLink(FAKE_LINK));
    expect(result.current.deleteLinkModal.open).toBe(true);
    expect(result.current.deleteLinkModal.link).toBe(FAKE_LINK);
  });

  it("closeDeleteLink resets", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openDeleteLink(FAKE_LINK));
    act(() => result.current.closeDeleteLink());
    expect(result.current.deleteLinkModal.open).toBe(false);
  });

  // --- Create Namespace ---
  it("openCreateNamespace / closeCreateNamespace toggle boolean", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openCreateNamespace());
    expect(result.current.createNamespaceModal).toBe(true);
    act(() => result.current.closeCreateNamespace());
    expect(result.current.createNamespaceModal).toBe(false);
  });

  // --- Invite ---
  it("openInvite sets namespace info", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openInvite(FAKE_NS_ID, "Team A"));
    expect(result.current.inviteModal).toEqual({
      open: true,
      namespaceId: FAKE_NS_ID,
      namespaceName: "Team A",
    });
  });

  it("closeInvite resets", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openInvite(FAKE_NS_ID, "Team A"));
    act(() => result.current.closeInvite());
    expect(result.current.inviteModal.open).toBe(false);
  });

  // --- Edit Profile ---
  it("openEditProfile / closeEditProfile toggle boolean", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openEditProfile());
    expect(result.current.editProfileModal).toBe(true);
    act(() => result.current.closeEditProfile());
    expect(result.current.editProfileModal).toBe(false);
  });

  // --- Delete Namespace ---
  it("openDeleteNs / closeDeleteNs", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openDeleteNs(FAKE_NS_ID, "Bye NS"));
    expect(result.current.deleteNsModal).toEqual({
      open: true,
      namespaceId: FAKE_NS_ID,
      namespaceName: "Bye NS",
    });
    act(() => result.current.closeDeleteNs());
    expect(result.current.deleteNsModal.open).toBe(false);
  });

  // --- Rename Namespace ---
  it("openRenameNs / closeRenameNs", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openRenameNs(FAKE_NS_ID, "Old Name", "desc"));
    expect(result.current.renameNsModal).toEqual({
      open: true,
      namespaceId: FAKE_NS_ID,
      namespaceName: "Old Name",
      namespaceDescription: "desc",
    });
    act(() => result.current.closeRenameNs());
    expect(result.current.renameNsModal.open).toBe(false);
  });

  // --- All Links View ---
  it("openAllLinksView sets namespace data", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openAllLinksView(FAKE_NS_ID, "All Links NS"));
    expect(result.current.allLinksView).toEqual({
      active: true,
      namespaceId: FAKE_NS_ID,
      namespaceName: "All Links NS",
    });
  });

  it("closeAllLinksView resets", () => {
    const { result } = renderHook(() => useProfileModals());
    act(() => result.current.openAllLinksView(FAKE_NS_ID, "NS"));
    act(() => result.current.closeAllLinksView());
    expect(result.current.allLinksView.active).toBe(false);
    expect(result.current.allLinksView.namespaceId).toBeNull();
  });
});
