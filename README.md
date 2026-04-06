# crnk-filtering

Zero-dependency TypeScript library for generating [CRNK](https://www.crnk.io/) / [JSON:API](https://jsonapi.org/) filter, sort & pagination query strings.

Works with **any** HTTP client — Angular, fetch, Axios, etc.

[![CI](https://github.com/dineeek/crnk-filtering/actions/workflows/ci.yml/badge.svg)](https://github.com/dineeek/crnk-filtering/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/crnk-filtering.svg?style=flat-square)](https://www.npmjs.com/package/crnk-filtering)
[![npm downloads](https://img.shields.io/npm/dw/crnk-filtering.svg?style=flat-square)](https://www.npmjs.com/package/crnk-filtering)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Features

- [Basic filtering](https://www.crnk.io/releases/stable/documentation/#_basic_filtering)
- [Nested filtering](https://www.crnk.io/releases/stable/documentation/#_nested_filtering)
- [Sorting](https://www.crnk.io/releases/stable/documentation/#_sorting)
- [Inclusion of Related Resources](https://www.crnk.io/releases/stable/documentation/#_inclusion_of_related_resources)
- [Pagination](https://www.crnk.io/releases/stable/documentation/#_pagination) (framework-agnostic)
- [Sparse fieldsets](https://www.crnk.io/releases/stable/documentation/#_sparse_fieldsets)
- Fluent method chaining
- Zero runtime dependencies
- ESM + CommonJS dual output

## Installation

```sh
npm install crnk-filtering
```

## Quick start

```ts
import {
  BasicFilter,
  FilterSpec,
  FilterOperator,
  SortSpec,
  SortDirection,
  PaginationSpec,
} from 'crnk-filtering';

const query = new BasicFilter({
  filterSpecs: [
    new FilterSpec('user.name', 'Dino', FilterOperator.Like),
    new FilterSpec('user.age', 25, FilterOperator.GreaterOrEquals),
  ],
  relatedResources: 'client',
})
  .sortBy(new SortSpec('user.name', SortDirection.ASC))
  .paginate(new PaginationSpec(0, 20))
  .toString();

// Result:
// include=client&filter[user.name][LIKE]=Dino%&filter[user.age][GE]=25&sort=user.name&page[limit]=20&page[offset]=0
```

### Using with any HTTP client

The library returns **plain objects and strings** — no framework lock-in:

```ts
// Angular HttpClient
this.http.get('/api/users', { params: filter.getParams() });

// fetch
fetch(`/api/users?${filter.toString()}`);

// Axios
axios.get('/api/users', { params: filter.getParams() });
```

## API reference

| Export | Description |
|-|-|
| `FilterSpec` | A single filter (path + value + operator) |
| `BasicFilter` | Builds flat CRNK filter query params |
| `NestedFilter` | Builds JSON-based nested filter query params |
| `FilterOperator` | Enum: `EQ`, `NEQ`, `LIKE`, `LT`, `LE`, `GT`, `GE` |
| `NestingOperator` | Enum: `AND`, `OR`, `NOT` |
| `SortSpec` | Sorting specification (path + direction) |
| `SortDirection` | Enum: `ASC`, `DESC` |
| `PaginationSpec` | Offset/limit pagination |
| `toQueryString()` | Converts `Record<string, string>` to a query string |
| `PageEvent` | Interface: `{ pageIndex, pageSize, length }` |

## FilterSpec

A filter is represented by a `FilterSpec`. It holds the **path** to the attribute, the filter **value**, and the **operator**.

```ts
// Defaults to FilterOperator.Equals
new FilterSpec('user.id', 12);

// Explicit operator
new FilterSpec('user.name', 'Dino', FilterOperator.Like);

// Nullable — allows null as a valid value
new FilterSpec('user.deletedAt', null, FilterOperator.Equals, true);
```

## Basic filtering

```ts
const result = new BasicFilter({
  filterSpecs: [
    new FilterSpec('user.id', 12, FilterOperator.Equals),
    new FilterSpec('user.name', 'Dino', FilterOperator.Like),
    new FilterSpec('user.age', 25, FilterOperator.GreaterOrEquals),
  ],
}).toString();

// filter[user.id][EQ]=12&filter[user.name][LIKE]=Dino%&filter[user.age][GE]=25
```

## Nested filtering

```ts
const result = new NestedFilter({
  filterSpecs: [
    new FilterSpec('user.id', 12, FilterOperator.Equals),
    new FilterSpec('user.name', 'Dino', FilterOperator.Like),
  ],
  nestingCondition: NestingOperator.And,
}).toString();

// filter={"AND": [{"user": {"EQ": {"id": "12"}}}, {"user": {"LIKE": {"name": "Dino%"}}}]}
```

### Nesting filters inside filters

```ts
const innerFilter = new NestedFilter({
  filterSpecs: innerSpecs,
  nestingCondition: NestingOperator.Or,
});

const result = new NestedFilter({
  filterSpecs: outerSpecs,
  nestingCondition: NestingOperator.And,
  innerNestedFilter: innerFilter.buildFilterString(), // accepts string or string[]
}).toString();
```

## Sorting

All filter classes support fluent `.sortBy()`:

```ts
new BasicFilter({ filterSpecs })
  .sortBy(new SortSpec('user.name', SortDirection.ASC))
  .toString();

// Multiple sort fields
new BasicFilter({ filterSpecs })
  .sortBy([
    new SortSpec('user.name', SortDirection.ASC),
    new SortSpec('user.id', SortDirection.DESC),
  ])
  .toString();
```

## Inclusion of Related Resources

```ts
new BasicFilter({
  filterSpecs,
  relatedResources: ['client', 'car'],
}).toString();

// include=client,car&filter[...]...
```

## Sparse fieldsets

```ts
new NestedFilter({
  filterSpecs,
  sparseFieldsets: ['user.id', 'user.name'],
}).toString();

// ...&fields=user.id,user.name
```

## Pagination

`PaginationSpec` is **framework-agnostic** — no Angular Material dependency.

```ts
// Built-in via chaining
new BasicFilter({ filterSpecs })
  .paginate(new PaginationSpec(0, 20))
  .toString();
// ...&page[limit]=20&page[offset]=0

// Or standalone — merge with existing params
const pagination = new PaginationSpec(0, 20);
const allParams = pagination.withParams(filter.getParams());
const queryString = toQueryString(allParams);
```

### Integrating with a paginator component

```ts
const pagination = new PaginationSpec(); // default: page 0, size 10

// On page change event from any paginator UI:
function onPageChange(event: { pageIndex: number; pageSize: number; length: number }) {
  pagination.setPagination(event);
  // Re-fetch data
}

// Reset
pagination.resetPaginator();
```

## Migration from v3 → v4

| v3 (Angular-based) | v4 (framework-agnostic) |
|-|-|
| `filter.getHttpParams()` | `filter.getParams()` returns `Record<string, string>` |
| `decodeURI(filter.getHttpParams().toString())` | `filter.toString()` |
| `paginationSpec.setHttpParams(filter.getHttpParams())` | `filter.paginate(paginationSpec).toString()` or `paginationSpec.withParams(filter.getParams())` |
| `import { PageEvent } from '@angular/material/paginator'` | `import { PageEvent } from 'crnk-filtering'` |
| `basicFilter.sortBy(...)` (void) | `basicFilter.sortBy(...)` (returns `this` — chainable) |
| `@angular/common/http` peer dependency | No dependencies |

## License

Apache License 2.0

Copyright (c) 2021-2026 Dino Klicek
