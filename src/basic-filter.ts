import { FilterSpec } from './filter-spec';
import { FilterOperator } from './operators';
import { PaginationSpec } from './pagination';
import { SortSpec } from './sort';
import {
  filterArray,
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
 * new BasicFilter({ filterSpecs: [...] })
 *   .sortBy(new SortSpec('user.name', SortDirection.ASC))
 *   .paginate(new PaginationSpec(0, 20))
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
    const specs = Array.isArray(queryParams.filterSpecs)
      ? queryParams.filterSpecs
      : [queryParams.filterSpecs];

    this.filterSpecs = filterArray(specs);

    this.relatedResources = queryParams.relatedResources
      ? getStringParams(queryParams.relatedResources)
      : null;

    this.sparseFieldsets = queryParams.sparseFieldsets
      ? getStringParams(queryParams.sparseFieldsets)
      : null;
  }

  /** Sets sorting. Returns `this` for chaining. */
  sortBy(sortSpecs: SortSpec | SortSpec[]): this {
    this.sort = getSortingParams(sortSpecs);
    return this;
  }

  /** Sets pagination. Returns `this` for chaining. */
  paginate(spec: PaginationSpec): this {
    this.paginationSpec = spec;
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

