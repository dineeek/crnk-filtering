import { FilterOperator, FilterOperatorType } from '../utils/crnk-operators';
import {
  transformLikeValuesToString,
  transformValuesToString,
} from '../utils/helper-functions';

export class FilterSpec {
  public pathSpec: string;
  public value: any;
  public operator: string;
  public relationPathAttributes: string[];
  public lastPathAttribute = '';
  public specsPreparedFlag = false;
  public nullable = false;

  /**
   * Represents a filter used in CRNK filtering.
   *
   * @param filterPathSpec - Path to the attribute.
   * @param filterValue  - Filter value.
   * @param filterOperator - Filter operator. Optional, if not provided default operator is `EQ`.
   */
  public constructor(
    filterPathSpec: string,
    filterValue: any,
    filterOperator?: FilterOperatorType,
    nullable?: boolean
  ) {
    this.pathSpec = filterPathSpec;
    this.value = filterValue;
    this.operator = filterOperator ? filterOperator : FilterOperator.Equals;
    this.relationPathAttributes = [];
    this.nullable = nullable ? true : false;
  }

  /**
   * Method `isPathValid` validates filter by its path.
   *
   */
  public isPathValid(): boolean {
    this.pathSpec = this.pathSpec.trim();
    return !!this.pathSpec;
  }

  /**
   * Method `isValueValid` validates filter by its value.
   *
   */
  public isValueValid(): boolean {
    if (this.nullable) {
      return !this.isFalsyValue();
    }

    if (!this.nullable) {
      return this.value !== null && !this.isFalsyValue();
    }

    return true;
  }

  private isFalsyValue(): boolean {
    if (
      this.value === undefined ||
      this.value === '' ||
      Number.isNaN(this.value)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Method `setBasicFilterLikeSpecs` calls the function to prepare basic filter values for LIKE operator by putting percentage values.
   */
  public setBasicFilterLikeSpecs(): void {
    this.value = transformLikeValuesToString(this.value, 'BASIC');
    this.specsPreparedFlag = true;
  }

  /**
   * Method `setNestedFilterSpecs` calls the functions to prepare filter attribute names and
   * filter values by putting quotes and/or percentage values for nested filter string.
   */
  public setNestedFilterSpecs(): void {
    this.setNestedRelationAttributes();
    this.prepareNestedFilterValues();
    this.specsPreparedFlag = true;
  }

  /**
   * Method `setNestedRelationAttributes` is setting up filter relation attributes if the attribute name is nested.
   */
  private setNestedRelationAttributes(): void {
    if (this.pathSpec.includes('.')) {
      this.relationPathAttributes = this.pathSpec.split('.');
      this.lastPathAttribute = this.relationPathAttributes.slice(-1)[0]; // Takes last attribute out of array
      this.relationPathAttributes = this.relationPathAttributes
        .slice(0, -1)
        .reverse(); // Removes last attribute and reverses the order of attribute names
    } else {
      this.lastPathAttribute = this.pathSpec;
    }
  }

  /**
   * Method `prepareNestedFilterValues` is setting double quotes and percentage signs on values if the filter operator is `LIKE`.
   * Else, only double quotes are put on values.
   */
  private prepareNestedFilterValues(): void {
    this.value =
      this.operator === 'LIKE'
        ? transformLikeValuesToString(this.value, 'NESTED')
        : transformValuesToString(this.value);
  }
}
