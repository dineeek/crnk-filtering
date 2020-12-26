import { HttpParams } from '@angular/common/http';
import { FilterSpec } from '../FilterSpec';
import { filterArray } from '../utils/array-helper-functions';

/**
 * 	Represents a instance for creating CRNK basic filter string and applying sorting.
 */
export class BasicFilter {
  private sort: string | null;
  public filterSpecs: Array<FilterSpec>;

  /**
   *
   * @param filterTypeArray - Array of FilterSpec's by which filter string is created.
   */
  public constructor(filterTypeArray: Array<FilterSpec>) {
    this.sort = null;
    this.filterSpecs = filterArray(filterTypeArray);
  }

  /**
   * Method `getHttpParams` is used in services to get and set HTTP request parameters.
   */
  public getHttpParams(): HttpParams {
    return this.setHttpParams();
  }

  /**
   * Method `setHttpParams` sets the builded filter string in the HTTP request if there is at least one valid filter.
   *
   * @param httpParams - HTTP parameters.
   */
  private setHttpParams(): HttpParams {
    let httpParams = new HttpParams();

    if (this.filterSpecs.length) {
      httpParams = this.buildStringFilter(new HttpParams());
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

  private buildStringFilter(httpParams: HttpParams): HttpParams {
    this.filterSpecs.forEach((filter) => {
      if (filter.operator === 'LIKE') {
        filter = this.prepareFilterValue(filter);
      }

      httpParams = httpParams.set(
        'filter[' + filter.pathSpec + '][' + filter.operator + ']',
        filter.value
      );
    });

    return httpParams;
  }

  private prepareFilterValue(filter: FilterSpec): FilterSpec {
    if (filter.value instanceof Array) {
      const percentageSignValues: string[] = [];
      filter.value.forEach((element: any) => {
        percentageSignValues.push(element + '%');
      });

      filter.value =
        percentageSignValues.length === 1
          ? percentageSignValues[0]
          : percentageSignValues.join(',');
    } else {
      filter.value = filter.value + '%';
    }

    return filter;
  }
}
