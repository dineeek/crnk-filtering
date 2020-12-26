# Crnk-filtering

Crnk-filtering is a Typescript package for generating CRNK resource filters.

## Features!

- [Basic filtering] (https://www.crnk.io/releases/stable/documentation/#_basic_filtering)
- [Nested filtering] (https://www.crnk.io/releases/stable/documentation/#_nested_filtering)
- [Sorting] (https://www.crnk.io/releases/stable/documentation/#_sorting)

### Installation

```sh
$ npm install --save crnk-filtering
```

### Usage

A filter parameter is represented by a FilterSpec. It holds the path to the attribute, the filter value and the operator. The attribute specifies what gets filtered. The operator specifies how it is filtered. And the value specifies after what should be filtered.

An example looks like:

```typescript
const filterSpecUser = new FilterSpec("user.id", 12, FilterOperator.Equals);
```

The filter value is strongly typed. Typically (by default) it is assumed that the filter value matches the attribute type and Crnk will attempt to parse passed String-based filter value accordingly. There are exceptions, for example, the LIKE filter operator always requires the filter value to be a string to support wildcards for not just String types.

Operators within FilterSpec are represented by the FilterOperator class. By default, QuerySpec uses the EQ operator if no operator was provided. Crnk comes with a set of default filters as in the backend.

To apply generated CRNK filter, in HTTP calls define parameter `params` like in example bellow:

```typescript
  getData(
    basicFilter: BasicFilter,
  ): Observable<any> {
    return this.http.get<any>(
      your_url,
      {
        params: basicFilter.getHttpParams(),
      }
    );
  }

```

### Basic filtering

```typescript
const basicFilter = new BasicFilter([
  new FilterSpec("user.id", 12, FilterOperator.Equals),
  new FilterSpec("user.name", "Dino", FilterOperator.Like),
  new FilterSpec("user.age", 25, FilterOperator.GreaterOrEquals),
]).getHttpParams();
```

Above basic filter will result with following string:

```typescript
"filter[user.id][EQ]=12&filter[user.name][LIKE]=Dino%&filter[user.age][GE]=25";
```

### Nested filtering

```typescript
const nestedFilter = new NestedFilter(
  [
    new FilterSpec("user.id", 12, FilterOperator.Equals),
    new FilterSpec("user.name", "Dino", FilterOperator.Like),
    new FilterSpec("user.age", 25, FilterOperator.GreaterOrEquals),
  ],
  NestingOperator.And
).getHttpParams();
```

Above nested filter will result with following string:

```typescript
{"AND":
    [
      {"user": {"EQ": {"id": "12"}}},
      {"user": {"LIKE": {"name": "Dino%"}}},
      {"user": {"EQ": {"age": "32"}}},
    ]
}
```

It also supports creating a nested filter inside already nested filter string like in below example:
`{"name": "Great Task", "OR": {"id": 122, "name": "Other Task"}}`

```typescript
// First create inner nested filter string:
const innerNestedFilter = new NestedFilter(innerFilterSpecArray, NestingOperator.Or);
// Example of created part filter string:
{"OR": [{"user":{"EQ": {"id": "100"}}}, {"user":{"EQ": {"age": "30"}}}]}

// Then create main filter string calling this method:
const nestedFilter = new NestedFilter(filterSpecArray, NestingOperator.And, innerNestedFilter.buildFilterString());
// Result example of the whole filter string:
{"AND": [{"EQ": {"zip": "70"}}, {"OR": [{"user":{"EQ": {"id": "100"}}}, {"user":{"EQ": {"age": "30"}}}]}]}
```

### Sorting filtering

```typescript
basicFilter.sortBy(sort.direction, sort.active); // Sets the sort direction
// Call data fetch again
```
