import {
  isArrayFullOfEmptyStrings,
  isArrayFullOfStrings,
  prepareBasicFilterLikeValue,
  setQuotersAndPercentageSignOnValues,
  setQuotersOnValues,
} from '../utils/helper-functions';
import { FilterOperator, FilterOperatorType } from '../utils/crnk-operators';

export class FilterSpec {
  public pathSpec: string;
  public value: any;
  public operator: string;
  public relationPathAttributes: string[];
  public lastPathAttribute = '';
  private filterSpecsPrepared = false;

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
    filterOperator?: FilterOperatorType
  ) {
    this.pathSpec = filterPathSpec;
    this.value = filterValue;
    this.operator = filterOperator ? filterOperator : FilterOperator.Equals;
    this.relationPathAttributes = [];
  }

  /**
   * Method `isValid` validates filter specs by removing those who does not meet specified condition.
   *
   * The filter path and value needs to contain some value. If the filter value is instance of array then it checks for empty strings.
   * Also, if the filter has one string value then it checks if it is empty.
   * There is also validation for Date values and filter operators.
   */
  public isValid(): boolean {
    this.pathSpec = this.pathSpec.trim();

    if (
      !this.pathSpec ||
      this.value === null ||
      this.value === undefined ||
      Number.isNaN(this.value)
    ) {
      return false;
    }

    if (this.value instanceof Array) {
      if (!this.value.length) {
        return false;
      } else if (isArrayFullOfStrings(this.value)) {
        if (isArrayFullOfEmptyStrings(this.value)) {
          return false;
        }
      }
    }

    if (typeof this.value === 'string') {
      if (!this.value.trim().length) {
        return false;
      }
    }

    if (this.value instanceof Date) {
      if (
        Number.isNaN(this.value.getDate()) ||
        Number.isNaN(this.value.getFullYear())
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Method `setBasicFilterLikeSpecs` calls the function to prepare basic filter values for LIKE operator by putting percentage values.
   */
  public setBasicFilterLikeSpecs(): void {
    if (this.filterSpecsPrepared) {
      return;
    }

    this.value = prepareBasicFilterLikeValue(this.value);
    this.filterSpecsPrepared = true;
  }

  /**
   * Method `setNestedFilterSpecs` calls the function to prepare filter attribute names and
   * filter values by putting quotes and/or percentage values.
   */
  public setNestedFilterSpecs(): void {
    if (this.filterSpecsPrepared) {
      return;
    }

    this.setRelationAttributes();
    this.prepareFilterValues();
    this.filterSpecsPrepared = true;
  }

  /**
   * Method `setRelationAttributes` is setting up filter relation attributes if the attribute name is nested.
   */
  private setRelationAttributes(): void {
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
   * Method `prepareFilterValues` is setting double quotes and percentage signs on values if the filter operator is `LIKE`.
   * Else, only quotes are put on values.
   */
  private prepareFilterValues(): void {
    this.value =
      this.operator === 'LIKE'
        ? setQuotersAndPercentageSignOnValues(this.value)
        : setQuotersOnValues(this.value);
  }
}
