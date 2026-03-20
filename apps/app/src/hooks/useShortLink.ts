import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useWebHaptics } from "web-haptics/react";
import { useAuth } from "./useAuth";
import { getSessionId } from "../utils/session-id";
import { cleanConvexError } from "../utils/errors";
import { isValidUrl } from "../utils/bulk-utils";
import type { Namespace, ShortLinkResult } from "../types";

export interface UseShortLinkReturn {
  customSlug: string;
  setCustomSlug: (slug: string) => void;
  selectedNamespace: Namespace | null;
  setSelectedNamespace: (ns: Namespace | null) => void;
  shortLinkLoading: boolean;
  shortLinkError: string | null;
  setShortLinkError: (error: string | null) => void;
  pendingNsId: Id<"namespaces"> | null;
  setPendingNsId: (id: Id<"namespaces"> | null) => void;
  flatCustomCount: number;
  ownedNamespaces: Namespace[];
  allNamespaces: Namespace[];
  createShortLink: (targetUrl: string) => Promise<void>;
}

export function useShortLink(
  onShortLinkCreated?: (result: ShortLinkResult | null) => void,
): UseShortLinkReturn {
  const { trigger } = useWebHaptics();
  const { isAuthenticated } = useAuth();

  const [customSlug, setCustomSlug] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<Namespace | null>(null);
  const [shortLinkLoading, setShortLinkLoading] = useState(false);
  const [shortLinkError, setShortLinkError] = useState<string | null>(null);
  const [pendingNsId, setPendingNsId] = useState<Id<"namespaces"> | null>(null);

  // Race condition guard: ignore stale results after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const createAnonymousLink = useAction(api.links.createAnonymousLink);
  const createAutoSlugLink = useAction(api.links.createAutoSlugLink);
  const createCustomSlugLink = useAction(api.links.createCustomSlugLink);
  const createNamespacedLink = useAction(api.links.createNamespacedLink);

  const myLinks = useQuery(api.links.listMyLinks) ?? [];
  const myNamespaces = useQuery(api.namespaces.listMine);

  const flatCustomCount = myLinks.filter((l) => !l.namespace && l.owner && !l.autoSlug).length;

  const ownedNamespaces = myNamespaces?.owned ?? [];

  const allNamespaces: Namespace[] = useMemo(
    () => [
      ...ownedNamespaces,
      ...(myNamespaces?.collaborated ?? []).filter(
        (ns): ns is NonNullable<typeof ns> => ns !== null,
      ),
    ],
    [ownedNamespaces, myNamespaces?.collaborated],
  );

  useEffect(() => {
    if (pendingNsId) {
      const ns = allNamespaces.find((n) => n._id === pendingNsId);
      if (ns) {
        setSelectedNamespace(ns);
        setPendingNsId(null);
      }
    }
  }, [pendingNsId, allNamespaces]);

  const createShortLink = useCallback(
    async (targetUrl: string) => {
      const valid = isValidUrl(targetUrl);
      if (!valid) return;
      setShortLinkLoading(true);
      setShortLinkError(null);
      try {
        let res: ShortLinkResult;
        if (!isAuthenticated) {
          res = await createAnonymousLink({
            destinationUrl: targetUrl,
            sessionId: getSessionId(),
          });
        } else if (selectedNamespace) {
          res = await createNamespacedLink({
            destinationUrl: targetUrl,
            namespaceId: selectedNamespace._id,
            slug: customSlug.trim() || undefined,
          });
        } else if (customSlug.trim()) {
          res = await createCustomSlugLink({
            destinationUrl: targetUrl,
            customSlug: customSlug.trim(),
          });
        } else {
          res = await createAutoSlugLink({
            destinationUrl: targetUrl,
          });
        }
        // Guard against stale results after unmount
        if (!mountedRef.current) return;
        onShortLinkCreated?.(res);
        trigger("success");
      } catch (err) {
        if (!mountedRef.current) return;
        const clean = cleanConvexError((err as Error).message || "Failed to create short link");
        setShortLinkError(clean || "Failed to create short link");
        trigger("error");
      } finally {
        if (mountedRef.current) {
          setShortLinkLoading(false);
        }
      }
    },
    [
      isAuthenticated,
      selectedNamespace,
      customSlug,
      createAnonymousLink,
      createAutoSlugLink,
      createNamespacedLink,
      createCustomSlugLink,
      onShortLinkCreated,
      trigger,
    ],
  );

  return {
    customSlug,
    setCustomSlug,
    selectedNamespace,
    setSelectedNamespace,
    shortLinkLoading,
    shortLinkError,
    setShortLinkError,
    pendingNsId,
    setPendingNsId,
    flatCustomCount,
    ownedNamespaces,
    allNamespaces,
    createShortLink,
  };
}
