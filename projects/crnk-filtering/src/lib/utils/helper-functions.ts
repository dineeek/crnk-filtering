import { FilterSpec } from '../filter-specification/FilterSpec';
import { SortSpec } from './sort/sort-spec';

/**
 * Helper function `filterArray` returns an array with filters that meet the needed criteria to be valid.
 *
 * @param filterSpecs - Array of FilterSpec which values goes through filtering.
 */
export function filterArray(filterSpecs: Array<FilterSpec>): Array<FilterSpec> {
  return filterSpecs.filter((filterSpec) => {
    if (!filterSpec || !filterSpec.isValid()) {
      return false;
    }

    if (filterSpec.value instanceof Array) {
      filterSpec.value = compact(filterSpec.value);
      if (isArrayFullOfStrings(filterSpec.value)) {
        filterSpec.value = compact(getTrimmedStringsArray(filterSpec.value));
        return filterSpec.value.length;
      } else if (isArrayContainingString(filterSpec.value)) {
        filterSpec.value = compact(trimStringsInsideArray(filterSpec.value));
        return filterSpec.value.length;
      }
      return filterSpec.value.length;
    } else if (typeof filterSpec.value === 'string') {
      filterSpec.value = filterSpec.value.trim();
      return filterSpec.value.length;
    } else if (filterSpec.value instanceof Date) {
      return (
        !isNaN(filterSpec.value.getDate()) ||
        !isNaN(filterSpec.value.getFullYear())
      );
    }

    return filterSpec.isValid();
  });
}

/**
 * Helper function `compact` removes null, undefined, '' and NaN values from an array.
 *
 * @param arr - Array to perform action.
 */
function compact(arr: any[]): any[] {
  return arr.filter(
    (element) =>
      element !== null &&
      element !== undefined &&
      element !== '' &&
      !Number.isNaN(element)
  );
}

/**
 * Helper function `isArrayFullOfStrings` determines if all elements of the array are a type of string.
 *
 * @param arr - Array to check if all elements are string.
 */
function isArrayFullOfStrings(arr: any[]): boolean {
  return arr.every((element: any) => typeof element === 'string');
}

/**
 * Helper function `isArrayContainingString` determines if the array has at least one string.
 *
 * @param arr - Array to search for string type.
 */
function isArrayContainingString(arr: any[]): boolean {
  return arr.some((element: any) => typeof element === 'string');
}

/**
 * Helper function `getTrimmedStringsArray` returns all strings inside array trimmed.
 *
 * @param arr - String array to perform trimming on its elements.
 */
function getTrimmedStringsArray(arr: string[]): string[] {
  return arr.map((element: string) => element.trim());
}

/**
 * Helper function `trimStringsInsideArray` returns trimmed strings inside array.
 *
 * @param arr - Array to search for strings values to re
 */
function trimStringsInsideArray(arr: any[]): any[] {
  return arr.map((element: any) => {
    if (typeof element === 'string') {
      element = element.trim();
    }
    return element;
  });
}

/**
 * Helper function `getIncludedResources` returns included resources as a single string value.
 *
 * @param includedResources - One or many included resources of relationship.
 */
export function getIncludedResources(
  includedResources: string | Array<string>
): string | null {
  const resources =
    includedResources instanceof Array
      ? filterEmptyStringValues(includedResources)
      : filterEmptyStringValues(new Array<string>(includedResources));

  if (!resources.length) {
    return null;
  }

  return resources.length > 1 ? resources.join(',') : resources[0];
}

/**
 * Helper function `filterEmptyStringValues` trims all string elements and removes all falsy values from the array.
 *
 * @param arr - String array to perform action.
 */
function filterEmptyStringValues(arr: string[]): string[] {
  return compact(trimStringsInsideArray(arr));
}

/**
 * Helper function `getSortingParams` returns sorting specs as a single string value.
 *
 * @param sortSpecs - One or many SortSpecs.
 */
export function getSortingParams(
  sortSpecs: SortSpec | Array<SortSpec>
): string | null {
  if (!sortSpecs) {
    return null;
  }

  if (sortSpecs instanceof Array) {
    let sortParams: string[] = [];

    sortParams = sortSpecs
      .filter((sortSpec) => sortSpec.sortParam)
      .map((sortSpec) => sortSpec.sortParam);

    if (!sortParams.length) {
      return null;
    }

    return sortParams.length > 1 ? sortParams.join(',') : sortParams[0];
  } else {
    return sortSpecs.sortParam;
  }
}

/**
 * Function `setQuotersAndPercentageSignOnValues` sets the percentage sign and in nested filtering,
 * double-quotes on all array values or a single value.
 * If the array contains only one value then filter value losses array data type and it is passed as a single value.
 */
export function setQuotersAndPercentageSignOnLikeValues(
  value: any,
  filterType: 'BASIC' | 'NESTED'
): void {
  if (value instanceof Array) {
    const percentageSignValues: string[] = [];
    value.forEach((element: any) => {
      filterType === 'BASIC'
        ? percentageSignValues.push(element + '%')
        : percentageSignValues.push('"' + element + '%"');
    });

    value =
      percentageSignValues.length === 1
        ? percentageSignValues[0]
        : filterType === 'BASIC'
        ? percentageSignValues.join(',')
        : '[' + percentageSignValues.join(', ') + ']';
  } else {
    value = filterType === 'BASIC' ? value + '%' : '"' + value + '%"';
  }

  return value;
}

/**
 * Function `setQuotersOnValues` sets the double-quotes on all array values or single value.
 * If the array contains only one value then filter value losses array data type and is passed as a single value.
 */
export function setQuotersOnValues(value: any): void {
  if (value instanceof Array) {
    const quoteMarkedValues: string[] = [];
    value.forEach((element: any) => {
      quoteMarkedValues.push('"' + element + '"');
    });

    value =
      quoteMarkedValues.length === 1
        ? quoteMarkedValues[0]
        : '[' + quoteMarkedValues.join(', ') + ']';
  } else {
    value = '"' + value + '"';
  }

  return value;
}
