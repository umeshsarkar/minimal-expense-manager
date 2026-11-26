/** Categories offered until the user edits the list (stored under the 'category' key). */
export const DEFAULT_CATEGORIES: readonly string[] = ['Food', 'Internet', 'Transport', 'Car'];

/** Reads the stored category list (a JSON string), falling back to the defaults. */
export function parseStoredCategories(stored: unknown): string[] {
  if (typeof stored === 'string') {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed;
      }
    } catch {
      // fall through to defaults
    }
  }
  return [...DEFAULT_CATEGORIES];
}
