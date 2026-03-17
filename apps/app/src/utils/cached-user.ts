const CACHED_USER_KEY = "qrni_cached_user";

export interface CachedUser {
  name: string;
  email: string;
  image: string | null | undefined;
}

export function getCachedUser(): CachedUser | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? (JSON.parse(raw) as CachedUser) : null;
  } catch {
    return null;
  }
}

export function cacheUser(user: CachedUser): void {
  try {
    localStorage.setItem(
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
  localStorage.removeItem(CACHED_USER_KEY);
}

export function hasCachedUser(): boolean {
  return getCachedUser() !== null;
}
