import { createRouter, createRoute, createRootRoute, redirect } from "@tanstack/react-router";
import App from "./App";
import QRGeneratorPage from "./pages/QRGeneratorPage";
import ProfilePage from "./pages/ProfilePage";
import PrivacyPage from "./pages/PrivacyPage";
import InviteAcceptPage from "./pages/InviteAcceptPage";

const INVITE_RETURN_KEY = "qrni_invite_return";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const returnPath = sessionStorage.getItem(INVITE_RETURN_KEY);
    if (returnPath) {
      sessionStorage.removeItem(INVITE_RETURN_KEY);
      throw redirect({ to: returnPath });
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
