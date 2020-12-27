import compact from 'lodash.compact';
import { FilterSpec } from '../filter-specification/FilterSpec';
import { SortSpec } from './sort/sort-spec';

/**
 * Method `filterArray` returns array with filters which does not meet needed criteria.
 *
 * @param filterSpecs - Array of FilterSpec which values goes through filtering.
 */
export function filterArray(filterSpecs: Array<FilterSpec>): Array<FilterSpec> {
  const filteredArray = filterSpecs.filter((filterSpec) => {
    if (filterSpec.value instanceof Array) {
      filterSpec.value = compact(filterSpec.value); // Lodash compact method - removes null, undefined and '' from an array
      if (isArrayFullOfStrings(filterSpec.value)) {
        // Trimming strings if they exists in array
        filterSpec.value = compact(getTrimmedStringsArray(filterSpec.value));
      } else if (isArrayContainingString(filterSpec.value)) {
        filterSpec.value = compact(trimStringsInsideArray(filterSpec.value));
      }
    } else if (typeof filterSpec.value === 'string') {
      // Trimming single string value
      const trimmedValue = filterSpec.value.trim();
      filterSpec.value = trimmedValue.length ? trimmedValue : null;
    }

    return filterSpec.isValid() ? filterSpec : null;
  });

  return filteredArray;
}

function isArrayContainingString(arr: any[]): boolean {
  return arr.some((element: any) => typeof element === 'string');
}

function getTrimmedStringsArray(arr: any[]): string[] {
  return arr.map((element: string) => element.trim());
}

function trimStringsInsideArray(arr: any[]): any[] {
  const trimmedArray = arr.filter((element: string) => {
    if (typeof element === 'string') {
      element = element.trim();
    }
    return element;
  });
  return trimmedArray;
}

export function isArrayFullOfStrings(arr: any[]): boolean {
  return arr.every((element: any) => typeof element === 'string');
}

export function isArrayFullOfEmptyStrings(arr: any[]): boolean {
  const trimmedStrings = getTrimmedStringsArray(arr);
  return trimmedStrings.join('') ? false : true;
}

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

function filterEmptyStringValues(arr: string[]): string[] {
  return compact(trimStringsInsideArray(arr));
}

export function getSortingParams(
  sortSpecs: SortSpec | Array<SortSpec>
): string | null {
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
