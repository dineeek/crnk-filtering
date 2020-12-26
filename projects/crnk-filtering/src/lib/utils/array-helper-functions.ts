import { FilterSpec } from '../FilterSpec';
import compact from 'lodash.compact';

/**
 * Method `filterArray` allows you to filter the whole given array in constructor.
 * It works by rejecting all filters type which does not meet certain criteria and returns filtered array.
 *
 * @param filterTypeArray - Array of FilterSpec which values goes through filtering.
 */
export function filterArray(
  filterTypeArray: Array<FilterSpec>
): Array<FilterSpec> {
  const filteredArray = filterTypeArray.filter((filterType) => {
    if (filterType.value instanceof Array) {
      filterType.value = compact(filterType.value); // Lodash compact method - removes null, undefined and '' from an array
      if (isArrayFullOfStrings(filterType.value)) {
        // Trimming strings if they exists in array
        filterType.value = compact(getTrimmedStringsArray(filterType.value));
      } else if (isArrayContainingString(filterType.value)) {
        filterType.value = compact(trimStringsInsideArray(filterType.value));
      }
    } else if (typeof filterType.value === 'string') {
      // Trimming single string value
      const trimmedValue = filterType.value.trim();
      filterType.value = trimmedValue.length ? trimmedValue : null;
    }

    return filterType.isValid() ? filterType : null;
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
