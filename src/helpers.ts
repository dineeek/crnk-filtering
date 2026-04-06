import { FilterSpec } from './filter-spec';
import { SortSpec } from './sort';
import type { FilterValue } from './types';

// ---------------------------------------------------------------------------
// Filter array validation
// ---------------------------------------------------------------------------

/** Filters an array of FilterSpecs, removing entries with invalid paths / values. */
export function filterArray(filterSpecs: FilterSpec[]): FilterSpec[] {
  return filterSpecs.filter((spec) => {
    if (!spec?.isPathValid()) return false;

    if (typeof spec.value === 'string') {
      spec.value = spec.value.trim();
      return spec.value.length > 0;
    }

    if (spec.value instanceof Date) {
      return (
        !Number.isNaN(spec.value.getDate()) ||
        !Number.isNaN(spec.value.getFullYear())
      );
    }

    if (Array.isArray(spec.value)) {
      let arr = compact(spec.value);
      if (isAllStrings(arr)) {
        arr = compact(trimStrings(arr));
      } else if (hasAnyString(arr)) {
        arr = compact(trimStringsInArray(arr)) as typeof arr;
      }
      spec.value = arr;
      return arr.length > 0;
    }

    return spec.isValueValid();
  });
}

// ---------------------------------------------------------------------------
// Array utilities
// ---------------------------------------------------------------------------

/** Removes null, undefined, empty strings, and NaN values from an array. */
function compact<T>(arr: T[]): T[] {
  return arr.filter(
    (el) =>
      el !== null &&
      el !== undefined &&
      el !== '' &&
      !(typeof el === 'number' && Number.isNaN(el)),
  );
}

function isAllStrings(arr: unknown[]): arr is string[] {
  return arr.every((el) => typeof el === 'string');
}

function hasAnyString(arr: unknown[]): boolean {
  return arr.some((el) => typeof el === 'string');
}

function trimStrings(arr: string[]): string[] {
  return arr.map((el) => el.trim());
}

function trimStringsInArray(arr: unknown[]): unknown[] {
  return arr.map((el) => (typeof el === 'string' ? el.trim() : el));
}

// ---------------------------------------------------------------------------
// String param helpers
// ---------------------------------------------------------------------------

/** Joins string params into a comma-separated string, filtering empty values. */
export function getStringParams(
  params: string | string[],
  spaceBetween = false,
): string | null {
  const arr = Array.isArray(params) ? params : [params];
  const filtered = compact(trimStringsInArray(arr)) as string[];

  if (filtered.length === 0) return null;

  return filtered.length > 1
    ? filtered.join(spaceBetween ? ', ' : ',')
    : (filtered[0] ?? null);
}

/** Builds a comma-separated sort string from SortSpec(s). */
export function getSortingParams(
  sortSpecs: SortSpec | SortSpec[] | null | undefined,
): string | null {
  if (!sortSpecs) return null;

  if (Array.isArray(sortSpecs)) {
    if (sortSpecs.length === 0) return null;

    const params = sortSpecs
      .filter((s) => s.sortParam)
      .map((s) => s.sortParam);

    return params.length > 0 ? params.join(',') : null;
  }

  return sortSpecs.sortParam || null;
}

// ---------------------------------------------------------------------------
// Value transformation for filter strings
// ---------------------------------------------------------------------------

/**
 * Transforms values for the LIKE operator by appending `%`.
 * For NESTED type, also wraps values in double-quotes.
 *
 * **Returns** the transformed string (the old version incorrectly declared `void`).
 */
export function transformLikeValues(
  value: FilterValue,
  filterType: 'BASIC' | 'NESTED',
): string {
  if (Array.isArray(value)) {
    const mapped = value.map((el) =>
      filterType === 'BASIC' ? `${el}%` : `"${el}%"`,
    );
    if (mapped.length === 1) return mapped[0]!;
    return filterType === 'BASIC'
      ? mapped.join(',')
      : `[${mapped.join(', ')}]`;
  }

  return filterType === 'BASIC' ? `${value}%` : `"${value}%"`;
}

/**
 * Wraps values in double-quotes for nested filter strings.
 *
 * **Returns** the transformed string (the old version incorrectly declared `void`).
 */
export function transformValues(value: FilterValue): string {
  if (Array.isArray(value)) {
    const mapped = value.map((el) => `"${el}"`);
    if (mapped.length === 1) return mapped[0]!;
    return `[${mapped.join(', ')}]`;
  }

  return value !== null ? `"${value}"` : 'null';
}

// ---------------------------------------------------------------------------
// Query-string serialisation
// ---------------------------------------------------------------------------

/** Converts a key-value record to a raw (unencoded) query string. */
export function toQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

