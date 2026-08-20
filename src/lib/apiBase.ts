const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}
