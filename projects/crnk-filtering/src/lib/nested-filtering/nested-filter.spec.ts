import { FilterSpec } from '../filter-specification/FilterSpec';
import { FilterOperator, NestingOperator } from '../utils/crnk-operators';
import { PaginationSpec } from '../utils/pagination/pagination-spec';
import { SortDirection } from '../utils/sort/sort-direction';
import { SortSpec } from '../utils/sort/sort-spec';
import { NestedFilter } from './NestedFilter';

const filterArrayUser = [
  new FilterSpec('user.number', '30000', FilterOperator.GreaterOrEquals),
  new FilterSpec('user.name', 'Emil', FilterOperator.Like),
  new FilterSpec('user.contact.email', 'Emil@', FilterOperator.Like),
];

const filterArrayClient = [
  new FilterSpec('client.id', '16512'),
  new FilterSpec('client.name', 'Jag', FilterOperator.Like),
];

describe('Nested-filtering', () => {
  it('should be created nested filter string with single filter', () => {
    const nestedFilter = new NestedFilter(
      new FilterSpec('auto', 'Mazda       ')
    ).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'filter={"EQ": {"auto": "Mazda"}}'
    );
  });

  it('should be created nested filter string with date filter', () => {
    const nestedFilter = new NestedFilter([
      new FilterSpec('auto', 'Mazda       '),
      new FilterSpec(
        'registration',
        new Date('2012-07-28').toISOString(),
        FilterOperator.Equals
      ),
      new FilterSpec('insured', false, FilterOperator.Equals),
      new FilterSpec('firstOwner', true, FilterOperator.Equals),
    ]).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'filter={"AND": [{"EQ": {"auto": "Mazda"}}, {"EQ": {"registration": "2012-07-28T00:00:00.000Z"}}, {"EQ": {"insured": "false"}}, {"EQ": {"firstOwner": "true"}}]}'
    );
  });

  it('should be created nested filter string', () => {
    const nestedFilter = new NestedFilter(filterArrayUser);

    expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
      'filter={"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}'
    );

    // No new instantiation
    expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
      'filter={"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}'
    );
  });

  it('should be created nested filter string with default operator', () => {
    const nestedFilter = new NestedFilter(filterArrayClient).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'filter={"AND": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
    );
  });

  it('should be create nested filter inside another filter string', () => {
    const nestedFilterUser = new NestedFilter(
      filterArrayUser,
      NestingOperator.And
    );
    const nestedFilterClient = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      nestedFilterUser.buildFilterString()
    ).getHttpParams();

    expect(decodeURI(nestedFilterClient.toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}'
    );
  });

  it('should be created only main inner nested filter', () => {
    const filterArray = [
      new FilterSpec('   ', '    ', FilterOperator.Like),
      new FilterSpec('user', '', FilterOperator.Like),
    ];

    const nestedFilterClient = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or
    );
    const nestedFilterUser = new NestedFilter(
      filterArray,
      NestingOperator.And,
      nestedFilterClient.buildFilterString()
    ).getHttpParams();

    expect(decodeURI(nestedFilterUser.toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
    );
  });

  it('should be created nested filter inside nested string - complex version of setting main filter', () => {
    const filterArrayMoto = [
      new FilterSpec('bike.name', 'Suz', FilterOperator.Like),
      new FilterSpec('bike.company.email', 'Suzuki', FilterOperator.Like),
    ];

    // not empty
    const nestedFilterMoto = new NestedFilter(
      filterArrayMoto,
      NestingOperator.And
    );

    const filterArrayCar = [
      new FilterSpec('  ', '    ', FilterOperator.Like),
      new FilterSpec('car', '', FilterOperator.Like),
    ];

    // empty
    const nestedFilterCar = new NestedFilter(
      filterArrayCar,
      NestingOperator.And,
      nestedFilterMoto.buildFilterString()
    );

    // not empty
    const nestedFilterClient = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      nestedFilterCar.buildFilterString()
    );

    const filterArrayUsers = [
      new FilterSpec('user.name', null, FilterOperator.Like),
      new FilterSpec('user.contact.email', '', FilterOperator.Like),
    ];

    // empty
    const nestedFilterUsers = new NestedFilter(
      filterArrayUsers,
      NestingOperator.And,
      nestedFilterClient.buildFilterString()
    );

    expect(decodeURI(nestedFilterUsers.getHttpParams().toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"bike": {"LIKE": {"name": "Suz%"}}}, {"bike": {"company": {"LIKE": {"email": "Suzuki%"}}}}]}]}'
    );

    // No new instantiation
    expect(decodeURI(nestedFilterUsers.getHttpParams().toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"bike": {"LIKE": {"name": "Suz%"}}}, {"bike": {"company": {"LIKE": {"email": "Suzuki%"}}}}]}]}'
    );
  });

  it('should be empty filter string', () => {
    const filterArray = [
      new FilterSpec(' ', '    ', FilterOperator.Like),
      new FilterSpec(
        'user.contact.email',
        ['', '  ', '    '],
        FilterOperator.Like
      ),
    ];
    const nestedFilter = new NestedFilter(filterArray).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe('');
  });

  it('should create filter string with filter values in array', () => {
    const filterArray = [
      new FilterSpec('user.id', [1, 2, 3, undefined], FilterOperator.Equals),
      new FilterSpec('user.contact.email', 'Emil@', FilterOperator.Like),
      new FilterSpec(
        'user.number',
        [15153, 651515, '  ', 4121, , '', NaN, null],
        FilterOperator.Equals
      ),
    ];
    const nestedFilter = new NestedFilter(filterArray).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'filter={"AND": [{"user": {"EQ": {"id": ["1", "2", "3"]}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}, {"user": {"EQ": {"number": ["15153", "651515", "4121"]}}}]}'
    );
  });

  it('should work as nested in main filter string - version with arrays', () => {
    const filterArray = [
      new FilterSpec('user.id', [1, 2, 3, undefined], FilterOperator.Equals),
      new FilterSpec('user.contact.email', 'Emil@', FilterOperator.Like),
      new FilterSpec(
        'user.code',
        [15153, , , undefined, '651515', '  ', 4121, , '', null, 'Toyota'],
        FilterOperator.Equals
      ),
    ];
    const nestedFilter = new NestedFilter(filterArray);

    const nestedFilterClient = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      nestedFilter.buildFilterString()
    );

    expect(decodeURI(nestedFilterClient.getHttpParams().toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"EQ": {"id": ["1", "2", "3"]}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}, {"user": {"EQ": {"code": ["15153", "651515", "4121", "Toyota"]}}}]}]}'
    );

    // No new instantiation
    expect(decodeURI(nestedFilterClient.getHttpParams().toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"EQ": {"id": ["1", "2", "3"]}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}, {"user": {"EQ": {"code": ["15153", "651515", "4121", "Toyota"]}}}]}]}'
    );
  });

  it('should create filter string for LIKE operator with filter values in array', () => {
    const filterArray = [
      new FilterSpec(
        'user.id',
        [125, '', 123, '  ', 512],
        FilterOperator.Equals
      ),
      new FilterSpec(
        'user.name',
        ['Toy', 'Maz', '', , 'Jagu'],
        FilterOperator.Like
      ),
    ];
    const nestedFilter = new NestedFilter(filterArray).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'filter={"AND": [{"user": {"EQ": {"id": ["125", "123", "512"]}}}, {"user": {"LIKE": {"name": ["Toy%", "Maz%", "Jagu%"]}}}]}'
    );
  });

  it('should create empty filter string with filter values in array', () => {
    const filterArray = [
      new FilterSpec('user.id', [null, '', '  '], FilterOperator.Equals),
      new FilterSpec('user.contact.email', null, FilterOperator.Like),
    ];
    const nestedFilter = new NestedFilter(filterArray).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe('');
  });

  it('should work with 5 levels of JSON object', () => {
    const filterArray = [
      new FilterSpec('user.id', 12, FilterOperator.Equals),
      new FilterSpec(
        'user.address.city.street.apartment',
        10,
        FilterOperator.GreaterOrEquals
      ),
    ];
    const nestedFilter = new NestedFilter(filterArray).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'filter={"AND": [{"user": {"EQ": {"id": "12"}}}, {"user": {"address": {"city": {"street": {"GE": {"apartment": "10"}}}}}}]}'
    );
  });

  it('should be created nested filter string with inclusion of single related resources', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      null,
      'user'
    ).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'include=user&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
    );
  });

  it('should be created nested filter string with inclusion of multiple related resources', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      null,
      ['user', 'car', 'house']
    ).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'include=user,car,house&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
    );
  });

  it('should be created nested filter string with non inclusion of empty single related resources', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      null,
      '  '
    ).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
    );
  });

  it('should be created nested filter string with inclusion of multiple related resources while some are empty', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      null,
      ['', '  ', 'house', '  ', 'apartment']
    ).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'include=house,apartment&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
    );
  });

  it('should be created nested filter string with non inclusion of empty multiple related resources', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      null,
      ['  ', ' ', '  ']
    ).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
    );
  });

  it('should be create nested filter with inclusion and single sort param', () => {
    const nestedFilterUser = new NestedFilter(
      filterArrayUser,
      NestingOperator.And
    );
    const nestedFilterClient = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      nestedFilterUser.buildFilterString(),
      'client'
    );
    nestedFilterClient.sortBy(new SortSpec('user.name', SortDirection.DESC));

    expect(decodeURI(nestedFilterClient.getHttpParams().toString())).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name'
    );

    // No new instantiation
    expect(decodeURI(nestedFilterClient.getHttpParams().toString())).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name'
    );
  });

  it('should be create nested filter with inclusion and multiple sort param', () => {
    const nestedFilterUser = new NestedFilter(
      filterArrayUser,
      NestingOperator.And
    );
    const nestedFilterClient = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      nestedFilterUser.buildFilterString(),
      ['client', 'house']
    );
    nestedFilterClient.sortBy([
      new SortSpec('user.name', SortDirection.ASC),
      new SortSpec('user.number', SortDirection.DESC),
    ]);

    expect(decodeURI(nestedFilterClient.getHttpParams().toString())).toBe(
      'include=client,house&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=user.name,-user.number'
    );
  });

  it('should be created nested filter string with non inclusion and empty single sort param', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      null,
      '  '
    );
    nestedFilter.sortBy(new SortSpec('  ', SortDirection.ASC));

    expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
    );

    // No new instantiation
    expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
    );
  });

  it('should be created nested filter string with inclusion and empty multiple sort param', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      null,
      'client'
    );
    nestedFilter.sortBy([
      new SortSpec('  ', SortDirection.ASC),
      new SortSpec(' ', SortDirection.DESC),
    ]);

    expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
    );
  });

  it('should be create nested filter with default pagination specs', () => {
    const nestedFilterUser = new NestedFilter(
      filterArrayUser,
      NestingOperator.And
    );
    const nestedFilterClient = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      nestedFilterUser.buildFilterString(),
      'client'
    );
    nestedFilterClient.sortBy(new SortSpec('user.name', SortDirection.DESC));

    const paginationSpec = new PaginationSpec();

    expect(
      decodeURI(
        paginationSpec
          .setHttpParams(nestedFilterClient.getHttpParams())
          .toString()
      )
    ).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name&page[limit]=10&page[offset]=0'
    );
  });

  it('should be create nested filter with custom pagination specs', () => {
    const nestedFilterUser = new NestedFilter(
      filterArrayUser,
      NestingOperator.And
    );
    const nestedFilterClient = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      nestedFilterUser.buildFilterString(),
      'client'
    );
    nestedFilterClient.sortBy(new SortSpec('user.name', SortDirection.DESC));

    const paginationSpec = new PaginationSpec(3, 20, 50);

    expect(
      decodeURI(
        paginationSpec
          .setHttpParams(nestedFilterClient.getHttpParams())
          .toString()
      )
    ).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name&page[limit]=20&page[offset]=60'
    );

    // No new instantiation
    expect(
      decodeURI(
        paginationSpec
          .setHttpParams(nestedFilterClient.getHttpParams())
          .toString()
      )
    ).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=-user.name&page[limit]=20&page[offset]=60'
    );
  });

  it('should be created nested filter string with single sparse fieldset', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      null,
      'client',
      'client.id'
    );
    nestedFilter.sortBy([
      new SortSpec('  ', SortDirection.ASC),
      new SortSpec(' ', SortDirection.DESC),
    ]);

    expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}&fields=client.id'
    );
  });

  it('should be created nested filter string with multiple sparse fieldsets', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      null,
      'client',
      ['client.id', 'client.name']
    );
    nestedFilter.sortBy([
      new SortSpec('  ', SortDirection.ASC),
      new SortSpec(' ', SortDirection.DESC),
    ]);

    expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}&fields=client.id,client.name'
    );
  });

  it('should be created nested filter string with multiple sparse fieldsets while some are empty strings', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or,
      null,
      'client',
      ['client.id', '   ', 'client.name', '']
    );
    nestedFilter.sortBy([
      new SortSpec('  ', SortDirection.ASC),
      new SortSpec(' ', SortDirection.DESC),
    ]);

    expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
      'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}&fields=client.id,client.name'
    );
  });
});
