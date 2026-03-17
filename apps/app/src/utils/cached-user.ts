const CACHED_USER_KEY = "qrni_cached_user";

export interface CachedUser {
  name: string;
  email: string;
  image: string | null | undefined;
}

export function getCachedUser(): CachedUser | null {
  try {
    const raw = sessionStorage.getItem(CACHED_USER_KEY);
    return raw ? (JSON.parse(raw) as CachedUser) : null;
  } catch {
    return null;
  }
}

export function cacheUser(user: CachedUser): void {
  try {
    sessionStorage.setItem(
      CACHED_USER_KEY,
      JSON.stringify({
        name: user.name,
        email: user.email,
        image: user.image,
      }),
    );
  } catch {
    /* ignore quota errors */
  }
}

export function clearCachedUser(): void {
  sessionStorage.removeItem(CACHED_USER_KEY);
  // Clean up any legacy localStorage entries
  try {
    localStorage.removeItem(CACHED_USER_KEY);
  } catch {
    /* ignore */
  }
}

export function hasCachedUser(): boolean {
  return getCachedUser() !== null;
}
