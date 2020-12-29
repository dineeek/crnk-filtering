import { HttpParams } from '@angular/common/http';
import { FilterSpec } from '../filter-specification/FilterSpec';
import { FilterOperator } from '../utils/crnk-operators';
import {
  filterArray,
  getIncludedResources,
  getSortingParams,
} from '../utils/helper-functions';
import { SortSpec } from '../utils/sort/sort-spec';

/**
 * 	Represents a instance of basic filter string.
 */
export class BasicFilter {
  private sort: string | null;
  private filterSpecs: Array<FilterSpec>;
  private includedResources: string | null; // Inclusion of Related Resources

  /**
   *
   * @param filterSpecs - Array of FilterSpec's for creating filter string.
   *     @param includeResources - Inclusion of related resources - pass single or multiple names of the resources
   *
   */
  public constructor(
    filterSpecs: FilterSpec | Array<FilterSpec>,
    includeResources?: string | Array<string>
  ) {
    this.sort = null;

    this.filterSpecs =
      filterSpecs instanceof Array
        ? filterArray(filterSpecs)
        : filterArray(new Array<FilterSpec>(filterSpecs));

    this.includedResources = includeResources
      ? getIncludedResources(includeResources)
      : null;
  }

  /**
   * Method `getHttpParams` is used to get and set HTTP request parameters.
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
      httpParams = this.buildStringFilter(httpParams);
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
   * Method `buildStringFilter` creates the whole basic filter string.
   *
   * @param httpParams - Http params on which will filter string be putted.
   */
  private buildStringFilter(httpParams: HttpParams): HttpParams {
    this.filterSpecs.forEach((filterSpec) => {
      if (
        !filterSpec.specsPreparedFlag &&
        filterSpec.operator === FilterOperator.Like
      ) {
        filterSpec.setBasicFilterLikeSpecs();
      }

      httpParams = httpParams.set(
        'filter[' + filterSpec.pathSpec + '][' + filterSpec.operator + ']',
        filterSpec.value
      );
    });

    return httpParams;
  }
}
