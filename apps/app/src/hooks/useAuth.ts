import { useConvexAuth } from "convex/react";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return { isAuthenticated, isLoading };
}
