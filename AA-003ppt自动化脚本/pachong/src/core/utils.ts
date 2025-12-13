export function normalizeUrl(base: string, href?: string | null): string {
  if (!href) return '';
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export function extractHrefFromHtml(html: string): string | undefined {
  const match = html.match(/href=['"]([^'"]+)['"]/i);
  return match?.[1];
}

export function parseNumber(text?: string): number | undefined {
  if (!text) return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}
