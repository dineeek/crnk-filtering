export enum FilterOperator {
  Equals = 'EQ',
  NotEquals = 'NEQ',
  Like = 'LIKE',
  Less = 'LT',
  LessOrEquals = 'LE',
  Greater = 'GT',
  GreaterOrEquals = 'GE',
}

export enum NestingOperator {
  And = 'AND',
  Or = 'OR',
  Not = 'NOT',
}

export type NestingOperatorType =
  | NestingOperator.And
  | NestingOperator.Or
  | NestingOperator.Not;

export type FilterOperatorType =
  | FilterOperator.Equals
  | FilterOperator.NotEquals
  | FilterOperator.Like
  | FilterOperator.Less
  | FilterOperator.LessOrEquals
  | FilterOperator.Greater
  | FilterOperator.GreaterOrEquals;
