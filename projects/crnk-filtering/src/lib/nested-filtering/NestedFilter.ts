import { HttpParams } from '@angular/common/http';
import { SortSpec } from '../../public-api';
import { FilterSpec } from '../filter-specification/FilterSpec';
import {
  filterArray,
  getIncludedResources,
  getSortingParams,
} from '../utils/helper-functions';
import { NestingOperator, NestingOperatorType } from '../utils/crnk-operators';

/**
 * 	 Represents a instance for creating filter string and applying sorting.
 */
export class NestedFilter {
  private sort: string | null;
  private filterSpecs: Array<FilterSpec>;
  private nestingCondition: NestingOperatorType;
  private innerNestedFilter: string | null;
  private includedResources: string | null; // Inclusion of Related Resources

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
    innerNestedFilter?: string | null,
    includeResources?: string | Array<string>
  ) {
    this.sort = null;

    this.filterSpecs =
      filterSpecs instanceof Array
        ? filterArray(filterSpecs)
        : filterArray(new Array<FilterSpec>(filterSpecs));

    this.nestingCondition = nestingCondition
      ? nestingCondition
      : NestingOperator.And;

    this.innerNestedFilter = innerNestedFilter ? innerNestedFilter : null;

    this.includedResources = includeResources
      ? getIncludedResources(includeResources)
      : null;
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
    if (this.includedResources) {
      httpParams = httpParams.set('include', this.includedResources);
    }

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
   * Method `sortBy` creates sorting part of HTTP request by setting up a sort string.
   *
   * @param sortSpecs - Sorting specification of the sort path and sort direction.
   */
  public sortBy(sortSpecs: SortSpec | Array<SortSpec>): void {
    this.sort = getSortingParams(sortSpecs);
  }

  /**
   * Method `buildFilterString` creates the whole filter string by accumulating every filter contained in the filtered array.
   *
   */
  public buildFilterString(): string {
    let filterString = '';
    let filterStringCore = '';
    this.filterSpecs.forEach((filterSpec) => {
      filterSpec.setNestedFilterSpecs();

      filterStringCore =
        '{"' +
        filterSpec.operator +
        '": {"' +
        filterSpec.lastPathAttribute +
        '": ' +
        filterSpec.value +
        '}}, ';

      filterString += filterSpec.relationPathAttributes.length
        ? this.nestRelations(filterSpec, filterStringCore)
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
   * @param filterSpec - One filterSpec from array.
   * @param filterString - Core string part of every filter.
   */
  private nestRelations(filterSpec: FilterSpec, filterString: string): string {
    filterString = this.removeComma(filterString);
    filterSpec.relationPathAttributes.forEach((attribute) => {
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
