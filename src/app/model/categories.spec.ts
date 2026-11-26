import { DEFAULT_CATEGORIES, parseStoredCategories } from './categories';

describe('parseStoredCategories', () => {
  it('reads a stored JSON list', () => {
    expect(parseStoredCategories('["Rent","Gym"]')).toEqual(['Rent', 'Gym']);
  });

  it('falls back to the defaults for missing or broken data', () => {
    expect(parseStoredCategories(null)).toEqual([...DEFAULT_CATEGORIES]);
    expect(parseStoredCategories('not json')).toEqual([...DEFAULT_CATEGORIES]);
    expect(parseStoredCategories('{"a":1}')).toEqual([...DEFAULT_CATEGORIES]);
  });

  it('returns a fresh array each time (callers may modify it)', () => {
    expect(parseStoredCategories(null)).not.toBe(parseStoredCategories(null));
  });
});
