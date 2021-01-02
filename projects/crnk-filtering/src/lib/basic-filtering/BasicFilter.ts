import { HttpParams } from '@angular/common/http';
import { FilterSpec } from '../filter-specification/FilterSpec';
import { FilterOperator } from '../utils/crnk-operators';
import {
  filterArray,
  getSortingParams,
  getStringParams,
} from '../utils/helper-functions';
import { SortSpec } from '../utils/sort/sort-spec';

/**
 * 	Represents a instance of basic filter string.
 */
export class BasicFilter {
  private sort: string | null;
  private filterSpecs: Array<FilterSpec>;
  private relatedResources: string | null; // Inclusion of Related Resources
  private sparseFieldsets: string | null; // Information about fields to include in the response
  /**
   *
   * @param filterSpecs - Array of FilterSpec's for creating filter string.
   * @param relatedResources - Inclusion of related resources - pass single or multiple names of the resources
   * @param sparseFieldsets - Information about fields to include in the response
   */
  public constructor(
    filterSpecs: FilterSpec | Array<FilterSpec>,
    relatedResources?: string | Array<string>,
    sparseFieldsets?: string | Array<string>
  ) {
    this.sort = null;

    this.filterSpecs =
      filterSpecs instanceof Array
        ? filterArray(filterSpecs)
        : filterArray(new Array<FilterSpec>(filterSpecs));

    this.relatedResources = relatedResources
      ? getStringParams(relatedResources)
      : null;

    this.sparseFieldsets = sparseFieldsets
      ? getStringParams(sparseFieldsets)
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
    if (this.relatedResources) {
      httpParams = httpParams.set('include', this.relatedResources);
    }

    if (this.filterSpecs.length) {
      httpParams = this.buildStringFilter(httpParams);
    }

    if (this.sparseFieldsets) {
      httpParams = httpParams.set('fields', this.sparseFieldsets);
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
