import { FilterSpec } from '../filter-specification/FilterSpec';
import { NestingOperatorType } from './crnk-operators';

export interface BasicQueryParameters {
  filterSpecs: FilterSpec | Array<FilterSpec>;
  relatedResources?: string | Array<string>;
  sparseFieldsets?: string | Array<string>;
}

export interface NestedQueryParameters {
  filterSpecs: FilterSpec | Array<FilterSpec>;
  nestingCondition?: NestingOperatorType;
  innerNestedFilter?: string;
  relatedResources?: string | Array<string>;
  sparseFieldsets?: string | Array<string>;
}
