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
- `FilterSpec.of()` static factory — create multiple filters from concise tuples
- `FilterSpecDef` tuple type — pass raw `[path, value, operator?, nullable?]` arrays directly to `filterSpecs`
- Inline `sortBy(path, direction)` overload — no need to instantiate `SortSpec` for single sorts
- Inline `paginate(pageIndex, pageSize)` overload — no need to instantiate `PaginationSpec`
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

- Sparse fieldsets

### 2.1.0

#### Feats

- Pagination

### 2.0.0

#### Feats

- Sorting
- Inclusion of Related Resources

### 1.0.0

#### Feats

- Basic filtering
- Nested filtering
