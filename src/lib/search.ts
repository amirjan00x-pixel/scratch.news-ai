export interface SearchEventDetail {
  query: string;
}

export type SearchCustomEvent = CustomEvent<SearchEventDetail>;

/**
 * Normalizes a user-provided search query so it can be safely used
 * inside Supabase filters without risking injection or syntax errors.
 */
export const normalizeSearchQuery = (query: string): string => {
  if (!query) return "";

  const trimmed = query.trim();
  if (!trimmed) return "";

  const sanitized = trimmed
    .replace(/[%_,()'"]/g, " ") // strip reserved characters
    .replace(/\s+/g, " ") // collapse whitespace
    .slice(0, 120); // prevent extremely long inputs

  return sanitized;
};
