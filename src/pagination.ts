import { toQueryString } from './helpers';
import type { PageEvent } from './types';

export class PaginationSpec {
  private pageIndex: number;
  private pageSize: number;
  private length: number;
  private currentPageEvent: PageEvent | null;

  constructor(pageIndex = 0, pageSize = 10, length = 0) {
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.length = length;
    this.currentPageEvent = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.length,
    };
  }

  /** Updates pagination from an external page event (e.g. a paginator component). */
  setPagination(pageEvent: PageEvent): this {
    this.currentPageEvent = pageEvent ?? null;
    return this;
  }

  /** Returns pagination key-value pairs. */
  getParams(): Record<string, string> {
    const params: Record<string, string> = {};

    if (this.currentPageEvent) {
      params['page[limit]'] = String(this.currentPageEvent.pageSize);
      params['page[offset]'] = String(
        this.currentPageEvent.pageIndex * this.currentPageEvent.pageSize,
      );
    }

    return params;
  }

  /** Merges pagination params onto an existing set of params and returns the combined record. */
  withParams(
    baseParams: Record<string, string> = {},
  ): Record<string, string> {
    return { ...baseParams, ...this.getParams() };
  }

  /** Returns the pagination query string only. */
  toString(): string {
    return toQueryString(this.getParams());
  }

  /** Resets pagination back to the values passed at construction time. */
  resetPaginator(): this {
    this.currentPageEvent = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.length,
    };
    return this;
  }
}

