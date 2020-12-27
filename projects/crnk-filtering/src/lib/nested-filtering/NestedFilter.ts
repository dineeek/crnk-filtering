import { HttpParams } from '@angular/common/http';
import { FilterSpec } from '../filter-specification/FilterSpec';
import { filterArray } from '../utils/array-helper-functions';
import { NestingOperator, NestingOperatorType } from '../utils/crnk-operators';

/**
 * 	 Represents a instance for creating filter string and applying sorting.
 */
export class NestedFilter {
  private sort: string | null;
  private filterSpecs: Array<FilterSpec>;
  private nestingCondition: NestingOperatorType;
  private innerNestedFilter: string | null;

  /**
   *
   * @param filterSpecs - Array of FilterSpec's by which filter string is created.
   * @param nestingCondition - Conditional nesting operator (`AND`, `OR`, `NOT`) which wraps the whole filter string.
   * By default, operator `AND` is applied.
   * @param innerNestedFilter - Optional, used in caste of nesting `AND`, `OR`, `NOT` operators.
   */
  public constructor(
    filterSpecs: FilterSpec | Array<FilterSpec>,
    nestingCondition?: NestingOperatorType,
    innerNestedFilter?: string
  ) {
    this.sort = null;

    filterSpecs =
      filterSpecs instanceof Array
        ? filterSpecs
        : new Array<FilterSpec>(filterSpecs);
    this.filterSpecs = filterArray(filterSpecs);

    this.nestingCondition = nestingCondition
      ? nestingCondition
      : NestingOperator.And;

    this.innerNestedFilter = innerNestedFilter ? innerNestedFilter : null;
  }

  /**
   * Method `getHttpParams` is used in services to get and set HTTP request parameters.
   */
  public getHttpParams(): HttpParams {
    return this.setHttpParams(new HttpParams());
  }

  /**
   * Method `setHttpParams` sets the builded filter string in the HTTP request if there is at least one valid filter.
   *
   * @param httpParams - HTTP parameters.
   */
  private setHttpParams(httpParams: HttpParams): HttpParams {
    if (this.filterSpecs.length) {
      httpParams = httpParams.set('filter', this.buildFilterString());
    } else if (!this.filterSpecs.length && this.innerNestedFilter) {
      // Nested inner filter string becomes the main filter (case when main filter is non existing because of its values)
      httpParams = httpParams.set('filter', this.innerNestedFilter);
    }

    if (this.sort) {
      httpParams = httpParams.set('sort', this.sort);
    }

    return httpParams;
  }

  /**
   * Method `isAnyFilter` is checking if there is at least one valid filter.
   */
  public isAnyFilter(): boolean {
    return this.filterSpecs.length ? true : false;
  }

  /**
   * Method `sortBy` creates second part of HTTP request by setting up a sort string.
   *
   * @param sortDirection - Sorting direction which can be descending (`'desc'`) or ascending (`'asc'`).
   * @param columnName - Name of the table column by which it should be sorted.
   */
  public sortBy(sortDirection: string, columnName: string): void {
    switch (sortDirection) {
      case 'desc':
        this.sort = '-' + columnName;
        break;
      case 'asc':
        this.sort = columnName;
        break;
    }
  }

  /**
   * Method `buildFilterString` creates the whole filter string by accumulating every filter contained in the filtered array.
   *
   */
  public buildFilterString(): string {
    let filterString = '';
    let filterStringCore = '';
    this.filterSpecs.forEach((filter) => {
      filter.setNestedFilterSpecs();

      filterStringCore =
        '{"' +
        filter.operator +
        '": {"' +
        filter.lastPathAttribute +
        '": ' +
        filter.value +
        '}}, ';

      filterString += filter.relationPathAttributes.length
        ? this.nestRelations(filter, filterStringCore)
        : filterStringCore;
    });

    // Case if there is necessary to nest AND, OR, NOT operators - look at buildNestedOperatorsFilterString method
    filterString = this.innerNestedFilter
      ? filterString + this.innerNestedFilter
      : this.removeComma(filterString);

    // Apply conditional operator if array consist more than one value or it has built in inner nested filter string
    if (
      this.filterSpecs.length > 1 ||
      (this.filterSpecs.length && this.innerNestedFilter)
    ) {
      filterString =
        '{"' + this.nestingCondition + '": [' + filterString + ']}';
    }

    return filterString;
  }

  /**
   * Method `nestRelations` builds filter string based on relation attributes of object name attributes.
   * Works with JSON multi-level relationships attribute name.
   *
   * @param filter - One filterSpec from array.
   * @param filterString - Core string part of every filter.
   */
  private nestRelations(filter: FilterSpec, filterString: string): string {
    filterString = this.removeComma(filterString);
    filter.relationPathAttributes.forEach((attribute) => {
      filterString = '{"' + attribute + '": ' + filterString + '}';
    });

    return filterString + ', ';
  }

  /**
   * Method `removeComma` removes comma at the end of passed filter string.
   *
   * @param filterString - Filter string for performing action.
   */
  private removeComma(filterString: string): string {
    return filterString.slice(0, -2); // Removes comma and one space
  }
}
