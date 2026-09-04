/**
 * Lowercased and stripped of diacritics.
 *
 * Typing "premiere" and getting nothing back for "Première dent" is the first
 * thing anyone does, in a French-speaking household especially. Folding both
 * the query and the text means it does not matter which side wears the accent.
 */
export function normalizeForSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Whether a query appears in any of the given fields.
 *
 * A blank query matches everything: an empty box is the absence of a filter,
 * not a filter that excludes everything. Fields may be undefined — an entry
 * without notes is searched on the fields it does have.
 */
export function matchesSearch(query: string, fields: (string | undefined)[]): boolean {
  const needle = normalizeForSearch(query.trim());
  if (needle === '') return true;
  return fields.some(
    (field) => field !== undefined && normalizeForSearch(field).includes(needle),
  );
}
