### 4.0.0

#### Breaking Changes

- Dropped all Angular dependencies — library is now zero-dependency
- Replaced `getHttpParams()` with `getParams()` returning `Record<string, string>`
- `toString()` now returns a plain unencoded query string
- `PaginationSpec` no longer depends on `@angular/material` `PageEvent`
- Removed `FilterOperatorType` and `NestingOperatorType` type aliases (use the enums directly)
- Minimum Node.js 18, TypeScript 5.5+

#### Features

- Fluent method chaining — `sortBy()` and `paginate()` return `this`
- New `paginate()` method on `BasicFilter` and `NestedFilter`
- New `toQueryString()` utility function
- New `PaginationSpec.withParams()` for merging params
- Framework-agnostic `PageEvent` interface export
- ESM + CommonJS dual output via tsup

#### Improvements

- Fixed return types on `transformLikeValues` / `transformValues` (were `void`, now `string`)
- Replaced TSLint with ESLint 9 flat config
- Replaced Karma/Jasmine with Vitest
- All source files renamed to kebab-case
- GitHub Actions CI/CD replacing Travis CI

### 3.3.0

#### Feats

- Adjusted NestedFilter to accept multiple inner filter strings

### 3.0.0

#### Feats

- [Sparse fieldsets] (https://www.crnk.io/releases/stable/documentation/#_sparse_fieldsets)

### 2.1.0

#### Feats

- [Pagination] (https://www.crnk.io/releases/stable/documentation/#_pagination)

### 2.0.0

#### Feats

- [Sorting] (https://www.crnk.io/releases/stable/documentation/#_sorting)
- [Inclusion of Related Resources] (https://www.crnk.io/releases/stable/documentation/#_inclusion_of_related_resources)

### 1.0.0

#### Feats

- [Basic filtering] (https://www.crnk.io/releases/stable/documentation/#_basic_filtering)
- [Nested filtering] (https://www.crnk.io/releases/stable/documentation/#_nested_filtering)
