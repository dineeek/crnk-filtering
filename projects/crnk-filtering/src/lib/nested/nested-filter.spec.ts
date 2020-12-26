import { FilterSpec } from '../FilterSpec';
import { FilterOperator, NestingOperator } from '../utils/crnk-operators';
import { NestedFilter } from './nested-filter';

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

  it('should be created nested filter string', () => {
    const nestedFilter = new NestedFilter(filterArrayUser).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'filter={"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}'
    );
  });

  it('should be created nested filter string with default operators', () => {
    const nestedFilter = new NestedFilter(
      filterArrayClient,
      NestingOperator.Or
    ).getHttpParams();

    expect(decodeURI(nestedFilter.toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
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
      new FilterSpec('user.name', '    ', FilterOperator.Like),
      new FilterSpec('user.contact.email', '', FilterOperator.Like),
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
      new FilterSpec('car.name', '    ', FilterOperator.Like),
      new FilterSpec('car.company.email', '', FilterOperator.Like),
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
    ).getHttpParams();

    expect(decodeURI(nestedFilterUsers.toString())).toBe(
      'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"bike": {"LIKE": {"name": "Suz%"}}}, {"bike": {"company": {"LIKE": {"email": "Suzuki%"}}}}]}]}'
    );
  });

  it('should be empty filter string', () => {
    const filterArray = [
      new FilterSpec('user.name', '    ', FilterOperator.Like),
      new FilterSpec('user.contact.email', '', FilterOperator.Like),
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
        [15153, 651515, '  ', 4121, , '', null],
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
    ).getHttpParams();

    expect(decodeURI(nestedFilterClient.toString())).toBe(
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
});
