export function getAppOrigin() {
  return window.location.origin
}

export function buildShortLinkUrl(slug, namespace) {
  const origin = getAppOrigin()
  if (namespace) {
    return `${origin}/${namespace}/${slug}`
  }
  return `${origin}/s/${slug}`
}
