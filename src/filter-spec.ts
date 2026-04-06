import { FilterOperator } from './operators';
import { transformLikeValues, transformValues } from './helpers';
import type { FilterValue } from './types';

export class FilterSpec {
  public pathSpec: string;
  public value: FilterValue;
  public operator: FilterOperator;
  public relationPathAttributes: string[] = [];
  public lastPathAttribute = '';
  public specsPreparedFlag = false;
  public readonly nullable: boolean;

  /**
   * Represents a single filter used in CRNK filtering.
   *
   * @param filterPathSpec - Dot-separated path to the attribute (e.g. `user.name`).
   * @param filterValue    - The value to filter by.
   * @param filterOperator - Filter operator (defaults to `EQ`).
   * @param nullable       - When `true`, `null` is treated as a valid filter value.
   */
  constructor(
    filterPathSpec: string,
    filterValue: FilterValue,
    filterOperator: FilterOperator = FilterOperator.Equals,
    nullable = false,
  ) {
    this.pathSpec = filterPathSpec;
    this.value = filterValue;
    this.operator = filterOperator;
    this.nullable = nullable;
  }

  /** Validates that the path is a non-empty string after trimming. */
  isPathValid(): boolean {
    this.pathSpec = this.pathSpec.trim();
    return this.pathSpec.length > 0;
  }

  /** Validates the filter value, taking the `nullable` flag into account. */
  isValueValid(): boolean {
    if (this.nullable) {
      return !this.isFalsyValue();
    }
    return this.value !== null && !this.isFalsyValue();
  }

  /** Prepares value for a BASIC LIKE filter (appends `%`). */
  setBasicFilterLikeSpecs(): void {
    this.value = transformLikeValues(this.value, 'BASIC');
    this.specsPreparedFlag = true;
  }

  /** Prepares both relation attributes and values for a NESTED filter. */
  setNestedFilterSpecs(): void {
    this.setNestedRelationAttributes();
    this.prepareNestedFilterValues();
    this.specsPreparedFlag = true;
  }

  // ---------------------------------------------------------------------------

  private isFalsyValue(): boolean {
    return (
      this.value === undefined ||
      this.value === '' ||
      (typeof this.value === 'number' && Number.isNaN(this.value))
    );
  }

  private setNestedRelationAttributes(): void {
    if (this.pathSpec.includes('.')) {
      const parts = this.pathSpec.split('.');
      this.lastPathAttribute = parts[parts.length - 1]!;
      this.relationPathAttributes = parts.slice(0, -1).reverse();
    } else {
      this.lastPathAttribute = this.pathSpec;
    }
  }

  private prepareNestedFilterValues(): void {
    this.value =
      this.operator === FilterOperator.Like
        ? transformLikeValues(this.value, 'NESTED')
        : transformValues(this.value);
  }
}

