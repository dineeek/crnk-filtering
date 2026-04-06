import { describe, it, expect } from 'vitest';
import {
  FilterSpec,
  FilterOperator,
  BasicFilter,
  SortSpec,
  SortDirection,
  PaginationSpec,
  toQueryString,
} from '../src';

describe('BasicFilter', () => {
  it('should create string with one single filter', () => {
    const basicFilter = new BasicFilter({
      filterSpecs: new FilterSpec('user.name', 'Auto', FilterOperator.Like),
    });

    expect(basicFilter.toString()).toBe('filter[user.name][LIKE]=Auto%');
    expect(basicFilter.isAnyFilter()).toBe(true);
  });

  it('should create string with one single filter in array', () => {
    const basicFilter = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', ['Auto'], FilterOperator.Like),
      ],
    });

    expect(basicFilter.toString()).toBe('filter[user.name][LIKE]=Auto%');
    expect(basicFilter.isAnyFilter()).toBe(true);
  });

  it('should create string with one filter in array', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Auto', FilterOperator.Like),
      ],
    }).toString();

    expect(result).toBe('filter[user.name][LIKE]=Auto%');
  });

  it('should create string with two filters', () => {
    const basicFilter = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Auto', FilterOperator.Like),
        new FilterSpec('user.number', '265112', FilterOperator.Equals),
      ],
    });

    expect(basicFilter.toString()).toBe(
      'filter[user.name][LIKE]=Auto%&filter[user.number][EQ]=265112',
    );

    // Idempotent — no new instantiation needed
    expect(basicFilter.toString()).toBe(
      'filter[user.name][LIKE]=Auto%&filter[user.number][EQ]=265112',
    );
  });

  it('should not create filter string with null, undefined and empty values', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user', '    ', FilterOperator.Like),
        new FilterSpec('   ', '', FilterOperator.Equals),
        new FilterSpec('user.address.city', null, FilterOperator.Equals),
        new FilterSpec('user.address.zip', undefined, FilterOperator.Equals),
      ],
    }).toString();

    expect(result).toBe('');
  });

  it('should recognize empty and non-empty filter values', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', '    ', FilterOperator.Like),
        new FilterSpec('user.number', '132312', FilterOperator.Equals),
        new FilterSpec('user.address.city', NaN, FilterOperator.Equals),
        new FilterSpec('user.address.zip', 32115, FilterOperator.Equals),
        new FilterSpec('insured', false, FilterOperator.Equals),
        new FilterSpec('firstOwner', null, FilterOperator.Equals),
      ],
    }).toString();

    expect(result).toBe(
      'filter[user.number][EQ]=132312&filter[user.address.zip][EQ]=32115&filter[insured][EQ]=false',
    );
  });

  it('should work with filter values in array', () => {
    const basicFilter = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', '    ', FilterOperator.Like),
        new FilterSpec(
          'user.number',
          [13513, undefined, 23151, , 21512, null, NaN],
          FilterOperator.Equals,
        ),
        new FilterSpec('user.address.city', [
          'Zurich',
          'Ljubljana',
          'Novi Sad',
        ]),
        new FilterSpec(
          'user.address.street',
          ['Gustav     ', 'Kaiser', '  Strasse '],
          FilterOperator.Like,
        ),
      ],
    });

    expect(basicFilter.toString()).toBe(
      'filter[user.number][EQ]=13513,23151,21512&filter[user.address.city][EQ]=Zurich,Ljubljana,Novi Sad&filter[user.address.street][LIKE]=Gustav%,Kaiser%,Strasse%',
    );

    // Idempotent
    expect(basicFilter.toString()).toBe(
      'filter[user.number][EQ]=13513,23151,21512&filter[user.address.city][EQ]=Zurich,Ljubljana,Novi Sad&filter[user.address.street][LIKE]=Gustav%,Kaiser%,Strasse%',
    );
  });

  it('should create filter string with one sort param (chained)', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Dino', FilterOperator.Like),
        new FilterSpec('user.number', '14141', FilterOperator.Equals),
      ],
    })
      .sortBy(new SortSpec('user.name', SortDirection.DESC))
      .toString();

    expect(result).toBe(
      'filter[user.name][LIKE]=Dino%&filter[user.number][EQ]=14141&sort=-user.name',
    );
  });

  it('should create filter string with multiple sort params (chained)', () => {
    const basicFilter = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
    }).sortBy([
      new SortSpec('user.name', SortDirection.DESC),
      new SortSpec('user.number', SortDirection.ASC),
    ]);

    expect(basicFilter.toString()).toBe(
      'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-user.name,user.number',
    );

    // Idempotent
    expect(basicFilter.toString()).toBe(
      'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-user.name,user.number',
    );
  });

  it('should create filter string with one sort param while second param is empty', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
    })
      .sortBy([
        new SortSpec('  ', SortDirection.DESC),
        new SortSpec('user.number', SortDirection.ASC),
      ])
      .toString();

    expect(result).toBe(
      'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=user.number',
    );
  });

  it('should create filter string with no sort param — empty sorting path spec', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
    })
      .sortBy([
        new SortSpec('', SortDirection.DESC),
        new SortSpec('   ', SortDirection.ASC),
      ])
      .toString();

    expect(result).toBe(
      'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123',
    );
  });

  it('should create filter string with inclusion of related resource', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: 'client',
    })
      .sortBy(new SortSpec('client.name', SortDirection.DESC))
      .toString();

    expect(result).toBe(
      'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-client.name',
    );
  });

  it('should create filter string without inclusion of related resource', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: ' ',
    })
      .sortBy(new SortSpec('client.name', SortDirection.DESC))
      .toString();

    expect(result).toBe(
      'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-client.name',
    );
  });

  it('should create filter string with inclusion of multiple related resources', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: ['client', 'car', ' '],
    })
      .sortBy(new SortSpec('client.name', SortDirection.ASC))
      .toString();

    expect(result).toBe(
      'include=client,car&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=client.name',
    );
  });

  it('should create filter string without inclusion of multiple related resources', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: [],
    })
      .sortBy(new SortSpec('user.name', SortDirection.DESC))
      .toString();

    expect(result).toBe(
      'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-user.name',
    );
  });

  it('should create filter string without inclusion of multiple empty related resources', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: ['  ', '', '    '],
    })
      .sortBy(new SortSpec('user.name', SortDirection.ASC))
      .toString();

    expect(result).toBe(
      'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=user.name',
    );
  });

  it('should create filter string with default pagination specs (chained)', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: 'client',
    })
      .sortBy(new SortSpec('client.name', SortDirection.DESC))
      .paginate(new PaginationSpec())
      .toString();

    expect(result).toBe(
      'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-client.name&page[limit]=10&page[offset]=0',
    );
  });

  it('should create filter string with custom pagination specs (chained)', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: 'client',
    })
      .sortBy(new SortSpec('client.name', SortDirection.DESC))
      .paginate(new PaginationSpec(2, 20, 0))
      .toString();

    expect(result).toBe(
      'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-client.name&page[limit]=20&page[offset]=40',
    );
  });

  it('should also work with standalone PaginationSpec.withParams()', () => {
    const basicFilter = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: 'client',
    }).sortBy(new SortSpec('client.name', SortDirection.DESC));

    const paginationSpec = new PaginationSpec();

    expect(
      toQueryString(paginationSpec.withParams(basicFilter.getParams())),
    ).toBe(
      'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-client.name&page[limit]=10&page[offset]=0',
    );
  });

  it('should create filter string with single sparse fieldset', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: 'client',
      sparseFieldsets: 'user.name',
    })
      .sortBy(new SortSpec('client.name', SortDirection.DESC))
      .paginate(new PaginationSpec())
      .toString();

    expect(result).toBe(
      'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&fields=user.name&sort=-client.name&page[limit]=10&page[offset]=0',
    );
  });

  it('should create filter string with multiple sparse fieldsets', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: 'client',
      sparseFieldsets: ['user.name', 'user.number'],
    })
      .sortBy(new SortSpec('client.name', SortDirection.DESC))
      .paginate(new PaginationSpec())
      .toString();

    expect(result).toBe(
      'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&fields=user.name,user.number&sort=-client.name&page[limit]=10&page[offset]=0',
    );
  });

  it('should create filter string with multiple sparse fieldsets while some are empty strings', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
        new FilterSpec('user.number', '14123', FilterOperator.Equals),
      ],
      relatedResources: 'client',
      sparseFieldsets: ['user.name', '  ', 'user.number', '  '],
    })
      .sortBy(new SortSpec('client.name', SortDirection.DESC))
      .paginate(new PaginationSpec())
      .toString();

    expect(result).toBe(
      'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&fields=user.name,user.number&sort=-client.name&page[limit]=10&page[offset]=0',
    );
  });

  it('should create string with nullable filter values', () => {
    const result = new BasicFilter({
      filterSpecs: [
        new FilterSpec('user.name', 'Auto', FilterOperator.Like),
        new FilterSpec('user.number', null, FilterOperator.Equals, true),
        new FilterSpec('user.address', 'Strasse', FilterOperator.Like),
        new FilterSpec('user.shortname', null, FilterOperator.Equals, false),
      ],
    }).toString();

    expect(result).toBe(
      'filter[user.name][LIKE]=Auto%&filter[user.number][EQ]=null&filter[user.address][LIKE]=Strasse%',
    );
  });

  it('should test edge cases: no filters, bad sorts, pagination', () => {
    const nonFilters = new BasicFilter({
      filterSpecs: [
        new FilterSpec('', '    ', FilterOperator.Like),
        new FilterSpec('user.number', NaN, FilterOperator.Equals),
        new FilterSpec(
          'user.date',
          new Date(undefined as unknown as string),
          FilterOperator.Equals,
          undefined,
        ),
      ],
    });

    expect(nonFilters.isAnyFilter()).toBe(false);

    nonFilters.sortBy(new SortSpec(null as unknown as string, undefined as unknown as string));
    nonFilters.sortBy(new SortSpec('asc', 'username'));
    nonFilters.sortBy(new SortSpec('desc', 'username'));

    const paginationSpec = new PaginationSpec();
    paginationSpec.setPagination(
      undefined as unknown as { pageIndex: number; pageSize: number; length: number },
    );
    expect(paginationSpec.toString()).toBeFalsy();

    paginationSpec.setPagination({ pageIndex: 0, pageSize: 0, length: 0 });
    expect(paginationSpec.toString()).toBeTruthy();
  });
});

