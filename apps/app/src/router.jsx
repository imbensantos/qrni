import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import App from './App'
import QRGeneratorPage from './pages/QRGeneratorPage'
import ProfilePage from './pages/ProfilePage'

const rootRoute = createRootRoute({
  component: App,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: QRGeneratorPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
})

export const routeTree = rootRoute.addChildren([indexRoute, profileRoute])
export const router = createRouter({ routeTree })
