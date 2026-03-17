const CACHED_USER_KEY = "qrni_cached_user";

export function getCachedUser() {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function cacheUser(user) {
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

export function clearCachedUser() {
  localStorage.removeItem(CACHED_USER_KEY);
}

export function hasCachedUser() {
  return getCachedUser() !== null;
}
