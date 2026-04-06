import { FilterSpec } from './filter-spec';
import { NestingOperator, SortDirection } from './operators';
import { PaginationSpec } from './pagination';
import { SortSpec } from './sort';
import {
  filterArray,
  normalizeSpecs,
  getSortingParams,
  getStringParams,
  toQueryString,
} from './helpers';
import type { NestedQueryParams } from './types';

/**
 * Builds a **nested** (JSON-based) CRNK filter query string.
 *
 * Supports fluent chaining:
 * ```ts
 * new NestedFilter({
 *   filterSpecs: FilterSpec.of(
 *     ['user.name', 'Dino', FilterOperator.Like],
 *     ['user.age', 25, FilterOperator.GreaterOrEquals],
 *   ),
 *   nestingCondition: NestingOperator.Or,
 * })
 *   .sortBy('user.name', SortDirection.DESC)
 *   .paginate(0, 20)
 *   .toString();
 * ```
 */
export class NestedFilter {
  private sort: string | null = null;
  private paginationSpec: PaginationSpec | null = null;
  private readonly filterSpecs: FilterSpec[];
  private readonly nestingCondition: NestingOperator;
  private readonly innerNestedFilter: string | null;
  private readonly relatedResources: string | null;
  private readonly sparseFieldsets: string | null;

  constructor(queryParams: NestedQueryParams) {
    this.filterSpecs = filterArray(normalizeSpecs(queryParams.filterSpecs));

    this.nestingCondition =
      queryParams.nestingCondition ?? NestingOperator.And;

    this.innerNestedFilter = queryParams.innerNestedFilter
      ? getStringParams(queryParams.innerNestedFilter, true)
      : null;

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
      params['filter'] = this.buildFilterString();
    } else if (this.innerNestedFilter) {
      params['filter'] = this.innerNestedFilter;
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

  /** Builds and returns just the filter JSON string (without other params). */
  buildFilterString(): string {
    let filterString = '';

    for (const spec of this.filterSpecs) {
      if (!spec.specsPreparedFlag) {
        spec.setNestedFilterSpecs();
      }

      const core = `{"${spec.operator}": {"${spec.lastPathAttribute}": ${spec.value}}}, `;

      filterString += spec.relationPathAttributes.length
        ? this.nestRelations(spec, core)
        : core;
    }

    // Append inner nested filter or trim trailing comma
    filterString = this.innerNestedFilter
      ? filterString + this.innerNestedFilter
      : this.removeTrailingComma(filterString);

    // Wrap in nesting operator when there are multiple specs or an inner filter
    if (
      this.filterSpecs.length > 1 ||
      (this.filterSpecs.length && this.innerNestedFilter)
    ) {
      filterString = `{"${this.nestingCondition}": [${filterString}]}`;
    }

    return filterString;
  }

  // ---------------------------------------------------------------------------

  private nestRelations(spec: FilterSpec, filterString: string): string {
    filterString = this.removeTrailingComma(filterString);

    for (const attribute of spec.relationPathAttributes) {
      filterString = `{"${attribute}": ${filterString}}`;
    }

    return filterString + ', ';
  }

  private removeTrailingComma(str: string): string {
    return str.slice(0, -2);
  }
}

