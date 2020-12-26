import {
  isArrayFullOfEmptyStrings,
  isArrayFullOfStrings,
} from './utils/array-helper-functions';
import { FilterOperator } from './utils/crnk-operators';

export class FilterSpec {
  public pathSpec: string;
  public value: any;
  public operator: string;
  public relationPathAttributes: string[];
  public lastPathAttribute = '';

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
    filterOperator?: string
  ) {
    this.pathSpec = filterPathSpec;
    this.value = filterValue;
    this.operator = filterOperator
      ? filterOperator.toUpperCase()
      : FilterOperator.Equals;
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

  // NESTED FILTERING

  /**
   * Method `setNestedFilterSpecs` calls the function to prepare filter attribute names and
   * filter values by putting quotes and/or percentage values.
   */
  public setNestedFilterSpecs(): void {
    this.setRelationAttributes();
    this.prepareFilterValues();
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
    if (this.areFilterValuesAlreadyPrepared()) {
      return;
    }

    if (this.operator === 'LIKE') {
      this.setQuotersAndPercentageSignOnValues();
    } else {
      this.setQuotersOnValues();
    }
  }

  /**
   * Method `areFilterValuesAlreadyPrepared` returns true if all values in the array or
   * single value already have double-quotes.
   *
   * Used because not every time new filter is instantiated on filter search.
   */
  private areFilterValuesAlreadyPrepared(): boolean {
    if (this.value instanceof Array) {
      if (this.value.every((element: any) => typeof element === 'string')) {
        return this.value.every((element: string) => element.indexOf('"') > -1);
      }
    }

    if (typeof this.value === 'string') {
      return this.value.indexOf('"') > -1;
    }

    return false;
  }

  /**
   * Method `setQuotersAndPercentageSignOnValues` sets the percentage sign and double-quotes on all array values or single value.
   * If the array contains only one value then filter value losses array data type and it is passed as a single value.
   */
  private setQuotersAndPercentageSignOnValues(): void {
    if (this.value instanceof Array) {
      const percentageSignValues: string[] = [];
      this.value.forEach((element: any) => {
        percentageSignValues.push('"' + element + '%"');
      });

      this.value =
        percentageSignValues.length === 1
          ? percentageSignValues[0]
          : '[' + percentageSignValues.join(', ') + ']';
    } else {
      this.value = '"' + this.value + '%"';
    }
  }

  /**
   * Method `setQuotersOnValues` sets the double-quotes on all array values or single value.
   * If the array contains only one value then filter value losses array data type and is passed as a single value.
   */
  private setQuotersOnValues(): void {
    if (this.value instanceof Array) {
      const quoteMarkedValues: string[] = [];
      this.value.forEach((element: any) => {
        quoteMarkedValues.push('"' + element + '"');
      });

      this.value =
        quoteMarkedValues.length === 1
          ? quoteMarkedValues[0]
          : '[' + quoteMarkedValues.join(', ') + ']';
    } else {
      this.value = '"' + this.value + '"';
    }
  }
}
