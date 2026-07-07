/** Extract DB hostname without retaining credentials in caller scope longer than needed. */
export function parseDatabaseHostname(connectionUrl: string | undefined): string | undefined {
  const trimmed = connectionUrl?.trim();
  if (!trimmed) return undefined;

  try {
    const normalized = trimmed.replace(/^postgres(ql)?:\/\//i, 'http://');
    return new URL(normalized).hostname || undefined;
  } catch {
    return undefined;
  }
}
