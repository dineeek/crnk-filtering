import { FilterSpec } from './filter-spec';
import { NestingOperator } from './operators';

/** Allowed filter value types. */
export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>;

/** Framework-agnostic page event (replaces @angular/material PageEvent). */
export interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

export interface BasicQueryParams {
  filterSpecs: FilterSpec | FilterSpec[];
  relatedResources?: string | string[];
  sparseFieldsets?: string | string[];
}

export interface NestedQueryParams {
  filterSpecs: FilterSpec | FilterSpec[];
  nestingCondition?: NestingOperator;
  innerNestedFilter?: string | string[];
  relatedResources?: string | string[];
  sparseFieldsets?: string | string[];
}

