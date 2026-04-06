import { FilterSpec } from './filter-spec';
import { FilterOperator, NestingOperator } from './operators';

/** Allowed filter value types. */
export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>;

/**
 * Tuple shorthand for creating a FilterSpec:
 * `[path, value]` or `[path, value, operator]` or `[path, value, operator, nullable]`
 */
export type FilterSpecDef =
  | [path: string, value: FilterValue]
  | [path: string, value: FilterValue, operator: FilterOperator]
  | [path: string, value: FilterValue, operator: FilterOperator, nullable: boolean];

/** Framework-agnostic page event (replaces @angular/material PageEvent). */
export interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

export interface BasicQueryParams {
  filterSpecs: FilterSpec | FilterSpec[] | FilterSpecDef[];
  relatedResources?: string | string[];
  sparseFieldsets?: string | string[];
}

export interface NestedQueryParams {
  filterSpecs: FilterSpec | FilterSpec[] | FilterSpecDef[];
  nestingCondition?: NestingOperator;
  innerNestedFilter?: string | string[];
  relatedResources?: string | string[];
  sparseFieldsets?: string | string[];
}

