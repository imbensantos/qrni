export function getAppOrigin(): string {
  return window.location.origin;
}

export function getAppHost(): string {
  return window.location.host;
}

export function buildShortLinkUrl(slug: string, namespace?: string): string {
  const origin = getAppOrigin();
  if (namespace) {
    return `${origin}/${namespace}/${slug}`;
  }
  return `${origin}/${slug}`;
}
