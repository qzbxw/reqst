export function sanitizeNextPath(next: string | null | undefined) {
  if (!next) {
    return null;
  }

  const value = next.trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function buildAuthHref(nextPath: string) {
  const params = new URLSearchParams();
  params.set("next", nextPath);
  return `/auth?${params.toString()}`;
}
