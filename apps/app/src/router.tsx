import { createRouter, createRoute, createRootRoute, redirect } from "@tanstack/react-router";
import App from "./App";
import QRGeneratorPage from "./pages/qr/QRGeneratorPage";
import ProfilePage from "./pages/profile/ProfilePage";
import PrivacyPage from "./pages/privacy/PrivacyPage";
import InviteAcceptPage from "./pages/invite/InviteAcceptPage";
import { INVITE_RETURN_KEY } from "./utils/constants";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    try {
      const returnPath = sessionStorage.getItem(INVITE_RETURN_KEY);
      if (returnPath) {
        sessionStorage.removeItem(INVITE_RETURN_KEY);
        throw redirect({ to: returnPath });
      }
    } catch (e) {
      if (e && typeof e === "object" && "to" in e) throw e;
      // Silently ignore storage errors (private browsing, disabled storage)
    }
  },
  component: QRGeneratorPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});

const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invite/$token",
  component: InviteAcceptPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  profileRoute,
  privacyRoute,
  inviteRoute,
]);
export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
