import { describe, it, expect } from 'vitest';
import {
  FilterSpec,
  FilterOperator,
  NestingOperator,
  NestedFilter,
  SortSpec,
  SortDirection,
  PaginationSpec,
  toQueryString,
} from '../src';

const filterArrayUser = [
  new FilterSpec('user.number', '30000', FilterOperator.GreaterOrEquals),
  new FilterSpec('user.name', 'Emil', FilterOperator.Like),
  new FilterSpec('user.contact.email', 'Emil@', FilterOperator.Like),
];

const filterArrayClient = [
  new FilterSpec('client.id', '16512'),
  new FilterSpec('client.name', 'Jag', FilterOperator.Like),
];

describe('NestedFilter', () => {
  it('should create nested filter string with single filter', () => {
    const nestedFilter = new NestedFilter({
      filterSpecs: new FilterSpec('auto', 'Mazda       '),
    });

    expect(nestedFilter.toString()).toBe(
      'filter={"EQ": {"auto": "Mazda"}}',
    );
    expect(nestedFilter.isAnyFilter()).toBe(true);
  });

  it('should create nested filter string with single filter and array values', () => {
    const nestedFilter = new NestedFilter({
      filterSpecs: [new FilterSpec('auto', ['Mazda       ', null])],
    });

    expect(nestedFilter.toString()).toBe(
      'filter={"EQ": {"auto": "Mazda"}}',
    );
    expect(nestedFilter.isAnyFilter()).toBe(true);
  });

  it('should create nested filter string with date filter', () => {
    const result = new NestedFilter({
      filterSpecs: [
        new FilterSpec('auto', 'Mazda       '),
        new FilterSpec(
          'registration',
          new Date('2012-07-28').toISOString(),
          FilterOperator.Equals,
        ),
        new FilterSpec(
          'dealer.date',
          new Date('asd'),
          FilterOperator.Equals,
        ),
        new FilterSpec('insured', false, FilterOperator.Equals),
        new FilterSpec('firstOwner', true, FilterOperator.Equals),
      ],
    }).toString();

    expect(result).toBe(
      'filter={"AND": [{"EQ": {"auto": "Mazda"}}, {"EQ": {"registration": "2012-07-28T00:00:00.000Z"}}, {"EQ": {"insured": "false"}}, {"EQ": {"firstOwner": "true"}}]}',
    );
  });

  it('should create nested filter string', () => {
    const nestedFilter = new NestedFilter({
      filterSpecs: filterArrayUser,
    });

    expect(nestedFilter.toString()).toBe(
      'filter={"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}',
    );

    // Idempotent
    expect(nestedFilter.toString()).toBe(
      'filter={"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}',
    );
  });

  it('should create nested filter string with default operator', () => {
    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
    }).toString();

    expect(result).toBe(
      'filter={"AND": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}',
    );
  });

  it('should create nested filter inside another filter string', () => {
    const nestedFilterUser = new NestedFilter({
      filterSpecs: filterArrayUser,
      nestingCondition: NestingOperator.And,
    });

    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      innerNestedFilter: nestedFilterUser.buildFilterString(),
    }).toString();

    expect(result).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}',
    );
  });

  it('should create only main inner nested filter', () => {
    const filterArray = [
      new FilterSpec('   ', '    ', FilterOperator.Like),
      new FilterSpec('user', '', FilterOperator.Like),
    ];

    const nestedFilterClient = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
    });

    const result = new NestedFilter({
      filterSpecs: filterArray,
      nestingCondition: NestingOperator.And,
      innerNestedFilter: nestedFilterClient.buildFilterString(),
    }).toString();

    expect(result).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}',
    );
  });

  it('should create nested filter inside nested string — complex version', () => {
    const filterArrayMoto = [
      new FilterSpec('bike.name', 'Suz', FilterOperator.Like),
      new FilterSpec('bike.company.email', 'Suzuki', FilterOperator.Like),
    ];

    const nestedFilterMoto = new NestedFilter({
      filterSpecs: filterArrayMoto,
      nestingCondition: NestingOperator.And,
    });

    const filterArrayCar = [
      new FilterSpec('  ', '    ', FilterOperator.Like),
      new FilterSpec('car', '', FilterOperator.Like),
    ];

    const nestedFilterCar = new NestedFilter({
      filterSpecs: filterArrayCar,
      nestingCondition: NestingOperator.And,
      innerNestedFilter: nestedFilterMoto.buildFilterString(),
    });

    const nestedFilterClient = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      innerNestedFilter: nestedFilterCar.buildFilterString(),
    });

    const filterArrayUsers = [
      new FilterSpec('user.name', null, FilterOperator.Like),
      new FilterSpec('user.contact.email', '', FilterOperator.Like),
    ];

    const nestedFilterUsers = new NestedFilter({
      filterSpecs: filterArrayUsers,
      nestingCondition: NestingOperator.And,
      innerNestedFilter: nestedFilterClient.buildFilterString(),
    });

    expect(nestedFilterUsers.toString()).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"bike": {"LIKE": {"name": "Suz%"}}}, {"bike": {"company": {"LIKE": {"email": "Suzuki%"}}}}]}]}',
    );

    // Idempotent
    expect(nestedFilterUsers.toString()).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"bike": {"LIKE": {"name": "Suz%"}}}, {"bike": {"company": {"LIKE": {"email": "Suzuki%"}}}}]}]}',
    );
  });

  it('should produce empty filter string', () => {
    const result = new NestedFilter({
      filterSpecs: [
        new FilterSpec(' ', '    ', FilterOperator.Like),
        new FilterSpec(
          'user.contact.email',
          ['', '  ', '    '],
          FilterOperator.Like,
        ),
      ],
    }).toString();

    expect(result).toBe('');
  });

  it('should create filter string with filter values in array', () => {
    const result = new NestedFilter({
      filterSpecs: [
        new FilterSpec(
          'user.id',
          [1, 2, 3, undefined],
          FilterOperator.Equals,
        ),
        new FilterSpec(
          'user.contact.email',
          'Emil@',
          FilterOperator.Like,
        ),
        new FilterSpec(
          'user.number',
          [15153, 651515, '  ', 4121, , '', NaN, null],
          FilterOperator.Equals,
        ),
      ],
    }).toString();

    expect(result).toBe(
      'filter={"AND": [{"user": {"EQ": {"id": ["1", "2", "3"]}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}, {"user": {"EQ": {"number": ["15153", "651515", "4121"]}}}]}',
    );
  });

  it('should work as nested in main filter string — version with arrays', () => {
    const filterArray = [
      new FilterSpec(
        'user.id',
        [1, 2, 3, undefined],
        FilterOperator.Equals,
      ),
      new FilterSpec(
        'user.contact.email',
        'Emil@',
        FilterOperator.Like,
      ),
      new FilterSpec(
        'user.code',
        [15153, , , undefined, '651515', '  ', 4121, , '', null, 'Toyota'],
        FilterOperator.Equals,
      ),
    ];

    const nestedFilter = new NestedFilter({ filterSpecs: filterArray });

    const nestedFilterClient = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      innerNestedFilter: nestedFilter.buildFilterString(),
    });

    expect(nestedFilterClient.toString()).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"EQ": {"id": ["1", "2", "3"]}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}, {"user": {"EQ": {"code": ["15153", "651515", "4121", "Toyota"]}}}]}]}',
    );

    // Idempotent
    expect(nestedFilterClient.toString()).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"EQ": {"id": ["1", "2", "3"]}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}, {"user": {"EQ": {"code": ["15153", "651515", "4121", "Toyota"]}}}]}]}',
    );
  });

  it('should create filter string for LIKE operator with filter values in array', () => {
    const result = new NestedFilter({
      filterSpecs: [
        new FilterSpec(
          'user.id',
          [125, '', 123, '  ', 512],
          FilterOperator.Equals,
        ),
        new FilterSpec(
          'user.name',
          ['Toy', 'Maz', '', , 'Jagu'],
          FilterOperator.Like,
        ),
      ],
    }).toString();

    expect(result).toBe(
      'filter={"AND": [{"user": {"EQ": {"id": ["125", "123", "512"]}}}, {"user": {"LIKE": {"name": ["Toy%", "Maz%", "Jagu%"]}}}]}',
    );
  });

  it('should create empty filter string with filter values in array', () => {
    const result = new NestedFilter({
      filterSpecs: [
        new FilterSpec(
          'user.id',
          [null, '', '  '],
          FilterOperator.Equals,
        ),
        new FilterSpec(
          'user.contact.email',
          null,
          FilterOperator.Like,
        ),
      ],
    }).toString();

    expect(result).toBe('');
  });

  it('should work with 5 levels of JSON object', () => {
    const result = new NestedFilter({
      filterSpecs: [
        new FilterSpec('user.id', 12, FilterOperator.Equals),
        new FilterSpec(
          'user.address.city.street.apartment',
          10,
          FilterOperator.GreaterOrEquals,
        ),
      ],
    }).toString();

    expect(result).toBe(
      'filter={"AND": [{"user": {"EQ": {"id": "12"}}}, {"user": {"address": {"city": {"street": {"GE": {"apartment": "10"}}}}}}]}',
    );
  });

  it('should create nested filter with inclusion of single related resources', () => {
    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: 'user',
    }).toString();

    expect(result).toBe(
      'include=user&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}',
    );
  });

  it('should create nested filter with inclusion of multiple related resources', () => {
    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: ['user', 'car', 'house'],
    }).toString();

    expect(result).toBe(
      'include=user,car,house&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}',
    );
  });

  it('should not include empty single related resource', () => {
    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: '  ',
    }).toString();

    expect(result).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}',
    );
  });

  it('should include related resources while skipping empty ones', () => {
    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: ['', '  ', 'house', '  ', 'apartment'],
    }).toString();

    expect(result).toBe(
      'include=house,apartment&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}',
    );
  });

  it('should not include empty multiple related resources', () => {
    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: ['  ', ' ', '  '],
    }).toString();

    expect(result).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}',
    );
  });

  it('should create nested filter with inclusion and single sort param (chained)', () => {
    const nestedFilterUser = new NestedFilter({
      filterSpecs: filterArrayUser,
      nestingCondition: NestingOperator.And,
    });

    const nestedFilterClient = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: 'client',
      innerNestedFilter: nestedFilterUser.buildFilterString(),
    }).sortBy(new SortSpec('user.name', SortDirection.DESC));

    expect(nestedFilterClient.toString()).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name',
    );

    // Idempotent
    expect(nestedFilterClient.toString()).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name',
    );
  });

  it('should create nested filter with inclusion and multiple sort params (chained)', () => {
    const nestedFilterUser = new NestedFilter({
      filterSpecs: filterArrayUser,
      nestingCondition: NestingOperator.And,
    });

    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: ['client', 'house'],
      innerNestedFilter: nestedFilterUser.buildFilterString(),
    })
      .sortBy([
        new SortSpec('user.name', SortDirection.ASC),
        new SortSpec('user.number', SortDirection.DESC),
      ])
      .toString();

    expect(result).toBe(
      'include=client,house&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=user.name,-user.number',
    );
  });

  it('should not include empty single sort param', () => {
    const nestedFilter = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: '  ',
    }).sortBy(new SortSpec('  ', SortDirection.ASC));

    expect(nestedFilter.toString()).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}',
    );

    // Idempotent
    expect(nestedFilter.toString()).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}',
    );
  });

  it('should not include empty multiple sort params', () => {
    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: 'client',
    })
      .sortBy([
        new SortSpec('  ', SortDirection.ASC),
        new SortSpec(' ', SortDirection.DESC),
      ])
      .toString();

    expect(result).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}',
    );
  });

  it('should create nested filter with default pagination specs (chained)', () => {
    const nestedFilterUser = new NestedFilter({
      filterSpecs: filterArrayUser,
      nestingCondition: NestingOperator.And,
    });

    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: 'client',
      innerNestedFilter: nestedFilterUser.buildFilterString(),
    })
      .sortBy(new SortSpec('user.name', SortDirection.DESC))
      .paginate(new PaginationSpec())
      .toString();

    expect(result).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name&page[limit]=10&page[offset]=0',
    );
  });

  it('should create nested filter with custom pagination specs (chained)', () => {
    const nestedFilterUser = new NestedFilter({
      filterSpecs: filterArrayUser,
      nestingCondition: NestingOperator.And,
    });

    const nestedFilterClient = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: 'client',
      innerNestedFilter: nestedFilterUser.buildFilterString(),
    })
      .sortBy(new SortSpec('user.name', SortDirection.DESC))
      .paginate(new PaginationSpec(3, 20, 50));

    expect(nestedFilterClient.toString()).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name&page[limit]=20&page[offset]=60',
    );

    // Idempotent
    expect(nestedFilterClient.toString()).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name&page[limit]=20&page[offset]=60',
    );
  });

  it('should also work with standalone PaginationSpec.withParams()', () => {
    const nestedFilterUser = new NestedFilter({
      filterSpecs: filterArrayUser,
      nestingCondition: NestingOperator.And,
    });

    const nestedFilterClient = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: 'client',
      innerNestedFilter: nestedFilterUser.buildFilterString(),
    }).sortBy(new SortSpec('user.name', SortDirection.DESC));

    const paginationSpec = new PaginationSpec(3, 20, 50);

    expect(
      toQueryString(
        paginationSpec.withParams(nestedFilterClient.getParams()),
      ),
    ).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name&page[limit]=20&page[offset]=60',
    );
  });

  it('should create nested filter with single sparse fieldset', () => {
    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: 'client',
      sparseFieldsets: 'client.id',
    })
      .sortBy([
        new SortSpec('  ', SortDirection.ASC),
        new SortSpec(' ', SortDirection.DESC),
      ])
      .toString();

    expect(result).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}&fields=client.id',
    );
  });

  it('should create nested filter with multiple sparse fieldsets', () => {
    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: 'client',
      sparseFieldsets: ['client.id', 'client.name'],
    })
      .sortBy([
        new SortSpec('  ', SortDirection.ASC),
        new SortSpec(' ', SortDirection.DESC),
      ])
      .toString();

    expect(result).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}&fields=client.id,client.name',
    );
  });

  it('should create nested filter with multiple sparse fieldsets while some are empty strings', () => {
    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      relatedResources: 'client',
      sparseFieldsets: ['client.id', '   ', 'client.name', ''],
    })
      .sortBy([
        new SortSpec('  ', SortDirection.ASC),
        new SortSpec(' ', SortDirection.DESC),
      ])
      .toString();

    expect(result).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}&fields=client.id,client.name',
    );
  });

  it('should create nested filter with nullable filter values', () => {
    const result = new NestedFilter({
      filterSpecs: [
        new FilterSpec('auto', null, FilterOperator.Equals, true),
        new FilterSpec('insured', false, FilterOperator.Equals),
        new FilterSpec('firstOwner', 'Dinko', FilterOperator.Equals, false),
        new FilterSpec('secondOwner', null, FilterOperator.Equals, false),
      ],
    }).toString();

    expect(result).toBe(
      'filter={"AND": [{"EQ": {"auto": null}}, {"EQ": {"insured": "false"}}, {"EQ": {"firstOwner": "Dinko"}}]}',
    );
  });

  it('should test edge cases: partial filters, bad sorts', () => {
    const filterArray = [
      new FilterSpec(
        'user.id',
        [1, 2, 3, undefined],
        FilterOperator.Equals,
      ),
      new FilterSpec(
        'user.contact.email',
        null,
        FilterOperator.Equals,
        true,
      ),
      new FilterSpec(
        'user.contact.address',
        undefined,
        FilterOperator.Equals,
        true,
      ),
      new FilterSpec(
        'user.date',
        new Date('gasfasd'),
        FilterOperator.Equals,
      ),
      new FilterSpec(
        'user.code',
        null,
        FilterOperator.Equals,
        undefined,
      ),
    ];

    const nestedFilter = new NestedFilter({ filterSpecs: filterArray });
    nestedFilter.sortBy(new SortSpec('', ''));
    nestedFilter.sortBy([]);
    nestedFilter.sortBy(undefined as unknown as SortSpec);
    expect(nestedFilter.isAnyFilter()).toBe(true);

    expect(nestedFilter.buildFilterString()).toEqual(
      '{"AND": [{"user": {"EQ": {"id": ["1", "2", "3"]}}}, {"user": {"contact": {"EQ": {"email": null}}}}]}',
    );

    nestedFilter.sortBy(new SortSpec('asc', 'user.id'));
    nestedFilter.sortBy(new SortSpec('desc', 'user.id'));
  });

  it('should create nested filter with multiple inner nested filter strings', () => {
    const nestedFilterUser = new NestedFilter({
      filterSpecs: filterArrayUser,
      nestingCondition: NestingOperator.And,
    });

    const nestedFilterCompany = new NestedFilter({
      filterSpecs: [
        new FilterSpec(
          'company.id',
          [1, 2, 3, undefined],
          FilterOperator.Equals,
        ),
        new FilterSpec(
          'company.contact.email',
          'Emil@',
          FilterOperator.Like,
        ),
        new FilterSpec(
          'company.code',
          [15153, , , undefined, '651515', '  ', 4121, , '', null, 'IBM'],
          FilterOperator.Equals,
        ),
      ],
    });

    const result = new NestedFilter({
      filterSpecs: filterArrayClient,
      nestingCondition: NestingOperator.Or,
      innerNestedFilter: [
        nestedFilterUser.buildFilterString(),
        nestedFilterCompany.buildFilterString(),
      ],
    }).toString();

    expect(result).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}, {"AND": [{"company": {"EQ": {"id": ["1", "2", "3"]}}}, {"company": {"contact": {"LIKE": {"email": "Emil@%"}}}}, {"company": {"EQ": {"code": ["15153", "651515", "4121", "IBM"]}}}]}]}',
    );
  });
});

