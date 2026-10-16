/** Respect Vite's base path when deploying to a project subdirectory. */
export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
