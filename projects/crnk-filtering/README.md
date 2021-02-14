# Crnk-filtering

Crnk-filtering is a Typescript package for generating CRNK resource filter strings.

<p align="start">
    <a href="https://travis-ci.com/dineeek/crnk-filtering"><img src="https://travis-ci.com/dineeek/crnk-filtering.svg?token=YSspYgvLPX2y3Q9zRFxp&branch=main" /></a>
    <!-- <a href="https://codecov.io/gh/dineeek/crnk-filtering"><img src="https://codecov.io/gh/dineeek/crnk-filtering/branch/main/graph/badge.svg?token=2K70FOOVGR"/></a> -->
    <a href="https://www.npmjs.com/package/crnk-filtering"><img alt="weekly downloads from npm" src="https://img.shields.io/npm/dw/crnk-filtering.svg?style=flat-square"></a>
    <a href="https://www.npmjs.com/package/crnk-filtering"><img alt="npm version" src="https://img.shields.io/npm/v/crnk-filtering.svg?style=flat-square"></a>
</p>

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/Naereen/StrapDown.js/graphs/commit-activity)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fdineeek%2Fcrnk-filtering.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fdineeek%2Fcrnk-filtering?ref=badge_shield)

## Features

- [Basic filtering] (https://www.crnk.io/releases/stable/documentation/#_basic_filtering) - from v1.0.1
- [Nested filtering] (https://www.crnk.io/releases/stable/documentation/#_nested_filtering) - from v1.0.1
- [Sorting] (https://www.crnk.io/releases/stable/documentation/#_sorting) - from v2.0.0
- [Inclusion of Related Resources] (https://www.crnk.io/releases/stable/documentation/#_inclusion_of_related_resources) - from v2.0.0
- [Pagination] (https://www.crnk.io/releases/stable/documentation/#_pagination) - from v2.1.0
- [Sparse fieldsets] (https://www.crnk.io/releases/stable/documentation/#_sparse_fieldsets) - from v3.0.0

**[View live demo on StackBlitz.](https://crnk-filtering.stackblitz.io)**

### Installation

```sh
$ npm install --save crnk-filtering
```

### Usage

A filter parameter is represented by a FilterSpec. It holds the path to the attribute, the filter value and the operator. The attribute specifies what gets filtered. The operator specifies how it is filtered. And the value specifies after what should be filtered.

An example looks like:

```typescript
const filterSpecUser = new FilterSpec('user.id', 12, FilterOperator.Equals);
```

The filter value is strongly typed. Typically (by default) it is assumed that the filter value matches the attribute type and Crnk will attempt to parse passed String-based filter value accordingly. There are exceptions, for example, the LIKE filter operator always requires the filter value to be a string to support wildcards for not just String types.

Operators within FilterSpec are represented by the FilterOperator class. By default, QuerySpec uses the EQ operator if no operator was provided. Crnk comes with a set of default filters as in the backend.

To apply generated CRNK filter in HTTP calls, define HTTP parameter `params` like in example bellow:

```typescript
  getData(
    filter: BasicFilter | NestedFilter,
  ): Observable<any> {
    return this.http.get<any>(
      'YOUR_URL',
      {
        params: filter.getHttpParams(),
      }
    );
  }

```

### Basic filtering

```typescript
const basicFilter = new BasicFilter({
	filterSpecs: [
		new FilterSpec('user.id', 12, FilterOperator.Equals),
		new FilterSpec('user.name', 'Dino', FilterOperator.Like),
		new FilterSpec('user.age', 25, FilterOperator.GreaterOrEquals)
	]
}).getHttpParams();
```

Above basic filter will result with following string:

```typescript
'filter[user.id][EQ]=12&filter[user.name][LIKE]=Dino%&filter[user.age][GE]=25';
```

### Nested filtering

```typescript
const nestedFilter = new NestedFilter({
	filterSpecs: [
		new FilterSpec('user.id', 12, FilterOperator.Equals),
		new FilterSpec('user.name', 'Dino', FilterOperator.Like),
		new FilterSpec('user.age', 25, FilterOperator.GreaterOrEquals)
	],
	nestingCondition: NestingOperator.And
}).getHttpParams();
```

Above nested filter will result with the following string:

```typescript
{"AND":
    [
      {"user": {"EQ": {"id": "12"}}},
      {"user": {"LIKE": {"name": "Dino%"}}},
      {"user": {"GE": {"age": "25"}}},
    ]
}
```

It also supports creating a nested filter inside already nested filter string like in below example:
`{"name": "Great Task", "OR": {"id": 122, "name": "Other Task"}}`

```typescript
// First create inner nested filter string:
const innerNestedFilter = new NestedFilter({filterSpecs: innerFilterSpecArray, nestingCondition: NestingOperator.Or});
// Example of created part filter string:
{"OR": [{"user":{"EQ": {"id": "100"}}}, {"user":{"EQ": {"age": "30"}}}]}

// Then create main filter string calling this method:
const nestedFilter = new NestedFilter({filterSpecs: filterSpecArray, nestingCondition: NestingOperator.And, innerNestedFilter: innerNestedFilter.buildFilterString()});
// Result example of the whole filter string:
{"AND": [{"EQ": {"zip": "70"}}, {"OR": [{"user":{"EQ": {"id": "100"}}}, {"user":{"EQ": {"age": "30"}}}]}]}
```

### Sorting filtering

Sorting information for the resources can be achieved by providing SortSpec parameter.

```typescript
const sortSpec = new SortSpec('user.id', SortDirection.ASC);
```

Sorting parameters are represented by SortSpec similar to FilterSpec above.

An example looks like:

```typescript
const basicFilter = new BasicFilter({
	filterSpecs: [
		new FilterSpec('user.id', 12, FilterOperator.Equals),
		new FilterSpec('user.name', 'Dino', FilterOperator.Like),
		new FilterSpec('user.age', 25, FilterOperator.GreaterOrEquals)
	]
});

basicFilter.sortBy([
	new SortSpec('user.id', SortDirection.ASC),
	new SortSpec('user.name', SortDirection.DESC)
]);

('filter[user.id][EQ]=12&filter[user.name][LIKE]=Dino%&filter[user.age][GE]=25&sort=user.id,-user.name');
```

The same logic applied for creating sorting with nesting filter string.

### Inclusion of Related Resources

Information about relationships to include in the response can be achieved by providing an `includeResources` parameters.

```typescript
const basicFilter = new BasicFilter({
	filterSpecs: [
		new FilterSpec('user.id', 12, FilterOperator.Equals),
		new FilterSpec('user.name', 'Dino', FilterOperator.Like),
		new FilterSpec(
			'client.personalInfo.age',
			25,
			FilterOperator.GreaterOrEquals
		)
	],
	relatedResources: ['client', 'car'] // Included resources
}).getHttpParams();

basicFilter.sortBy([
	new SortSpec('client.id', SortDirection.ASC),
	new SortSpec('car.name', SortDirection.DESC)
]);

// basicFilter.getHttpParams() returns:
('include=client,car&filter[user.id][EQ]=12&filter[user.name][LIKE]=Dino%&filter[client.personalInfo.age][GE]=25&sort=client.id,-car.name');
```

It is important to note that the requested main resource will be affected by included filter params or sorting params.

### Pagination

Crnk filtering can be used with `mat-paginator` elements in your table component. Pagination comes by default with support for offset/limit paging:

```typescript
  public paginationSpec: PaginationSpec;

  constructor() {
    this.paginationSpec = new PaginationSpec(); // creates default paging with params - pageIndex = 0, pageSize = 10, length = 0

    // Or create custom pagination specification
    this.paginationSpec = new PaginationSpec(); // creates default paging with params - pageIndex = 1, pageSize = 20, length = 10
  }

```

Example of URL:

`GET /tasks?page[offset]=0&page[limit]=10`

It is only useful with Angular material tables and declared `mat-paginator` in HTML:

```html
<mat-paginator
	showFirstLastButtons
	[pageSizeOptions]="[10, 25, 50, 100, 200]"
	[length]="paginationSpec.pageEvent.length"
	[pageSize]="paginationSpec.pageEvent.pageSize"
	[pageIndex]="0"
	(page)="onChangePaginatorPage($event)"
></mat-paginator>
```

In the component are declared methods to track changing page events and resetting pagination:

```typescript
  onChangePaginatorPage(e: PageEvent): void {
    this.paginationSpec.setPagination(e);
    // Fetch data again
  }

  // Resetting pagination
  resetPagination(): void {
    this.paginationSpec.resetPaginator();
  }
```

To apply generated pagination, define HTTP parameter `params` like in example bellow:

```typescript
  getData(
    filter: BasicFilter | NestedFilter,
    paginationSpec: PaginationSpec
  ): Observable<any> {
    return this.http.get<any>(
      'YOUR_URL',
      {
        params: paginationSpec.setHttpParams(filter.getHttpParams()),
      }
    );
  }

// paginationSpec.setHttpParams(filter.getHttpParams()) returns example:
("filter[user.id][EQ]=12&filter[user.name][LIKE]=Dino%&filter[client.personalInfo.age][GE]=25&sort=client.id,-car.name&page[limit]=10&page[offset]=0");
```

### Sparse fieldsets

Information about fields to include in the response can be achieved by providing fields parameter:

GET /tasks?fields=name,description

```typescript
const nestedFilter = new NestedFilter({
	filterSpecs: [
		new FilterSpec('user.id', 12, FilterOperator.Equals),
		new FilterSpec('user.name', 'Dino', FilterOperator.Like),
		new FilterSpec('user.age', 25, FilterOperator.GreaterOrEquals)
	],
	nestingCondition: NestingOperator.And,
	sparseFieldsets: ['user.id', 'user.age'] // include those fields in the response
}).getHttpParams();
```

# License

Apache License

Copyright (c) 2021 Dino Klicek
