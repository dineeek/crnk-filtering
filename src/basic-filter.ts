import { FilterSpec } from './filter-spec';
import { FilterOperator, SortDirection } from './operators';
import { PaginationSpec } from './pagination';
import { SortSpec } from './sort';
import {
  filterArray,
  normalizeSpecs,
  getSortingParams,
  getStringParams,
  toQueryString,
} from './helpers';
import type { BasicQueryParams } from './types';

/**
 * Builds a **basic** (flat) CRNK filter query string.
 *
 * Supports fluent chaining:
 * ```ts
 * new BasicFilter({
 *   filterSpecs: FilterSpec.of(
 *     ['user.name', 'Dino', FilterOperator.Like],
 *     ['user.age', 25, FilterOperator.GreaterOrEquals],
 *   ),
 * })
 *   .sortBy('user.name', SortDirection.ASC)
 *   .paginate(0, 20)
 *   .toString();
 * ```
 */
export class BasicFilter {
  private sort: string | null = null;
  private paginationSpec: PaginationSpec | null = null;
  private readonly filterSpecs: FilterSpec[];
  private readonly relatedResources: string | null;
  private readonly sparseFieldsets: string | null;

  constructor(queryParams: BasicQueryParams) {
    this.filterSpecs = filterArray(normalizeSpecs(queryParams.filterSpecs));

    this.relatedResources = queryParams.relatedResources
      ? getStringParams(queryParams.relatedResources)
      : null;

    this.sparseFieldsets = queryParams.sparseFieldsets
      ? getStringParams(queryParams.sparseFieldsets)
      : null;
  }

  /** Sets sorting. Accepts SortSpec instance(s) or inline `(path, direction)`. */
  sortBy(sortSpecs: SortSpec | SortSpec[]): this;
  sortBy(path: string, direction: SortDirection): this;
  sortBy(
    pathOrSpecs: string | SortSpec | SortSpec[],
    direction?: SortDirection,
  ): this {
    if (typeof pathOrSpecs === 'string') {
      this.sort = getSortingParams(new SortSpec(pathOrSpecs, direction!));
    } else {
      this.sort = getSortingParams(pathOrSpecs);
    }
    return this;
  }

  /** Sets pagination. Accepts a PaginationSpec or inline `(pageIndex, pageSize)`. */
  paginate(spec: PaginationSpec): this;
  paginate(pageIndex: number, pageSize: number): this;
  paginate(
    specOrIndex: PaginationSpec | number,
    pageSize?: number,
  ): this {
    this.paginationSpec =
      specOrIndex instanceof PaginationSpec
        ? specOrIndex
        : new PaginationSpec(specOrIndex, pageSize);
    return this;
  }

  /** `true` when at least one valid filter exists. */
  isAnyFilter(): boolean {
    return this.filterSpecs.length > 0;
  }

  /**
   * Returns a `Record<string, string>` of all query parameters.
   *
   * Compatible with Angular `HttpClient` params, `fetch`, Axios, etc.
   */
  getParams(): Record<string, string> {
    const params: Record<string, string> = {};

    if (this.relatedResources) {
      params['include'] = this.relatedResources;
    }

    if (this.filterSpecs.length) {
      this.buildFilterParams(params);
    }

    if (this.sparseFieldsets) {
      params['fields'] = this.sparseFieldsets;
    }

    if (this.sort) {
      params['sort'] = this.sort;
    }

    if (this.paginationSpec) {
      Object.assign(params, this.paginationSpec.getParams());
    }

    return params;
  }

  /** Returns the full query string (unencoded). */
  toString(): string {
    return toQueryString(this.getParams());
  }

  // ---------------------------------------------------------------------------

  private buildFilterParams(params: Record<string, string>): void {
    for (const spec of this.filterSpecs) {
      if (!spec.specsPreparedFlag && spec.operator === FilterOperator.Like) {
        spec.setBasicFilterLikeSpecs();
      }
      params[`filter[${spec.pathSpec}][${spec.operator}]`] = String(
        spec.value,
      );
    }
  }
}

