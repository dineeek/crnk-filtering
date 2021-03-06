import { FilterSpec } from '../filter-specification/FilterSpec';
import { FilterOperator, NestingOperator } from '../utils/crnk-operators';
import { PaginationSpec } from '../utils/pagination/pagination-spec';
import { SortDirection } from '../utils/sort/sort-direction';
import { SortSpec } from '../utils/sort/sort-spec';
import { NestedFilter } from './NestedFilter';

const filterArrayUser = [
	new FilterSpec('user.number', '30000', FilterOperator.GreaterOrEquals),
	new FilterSpec('user.name', 'Emil', FilterOperator.Like),
	new FilterSpec('user.contact.email', 'Emil@', FilterOperator.Like)
];

const filterArrayClient = [
	new FilterSpec('client.id', '16512'),
	new FilterSpec('client.name', 'Jag', FilterOperator.Like)
];

describe('Nested-filtering', () => {
	it('should be created nested filter string with single filter', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: new FilterSpec('auto', 'Mazda       ')
		});

		expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
			'filter={"EQ": {"auto": "Mazda"}}'
		);

		expect(nestedFilter.isAnyFilter()).toEqual(true);
	});

	it('should be created nested filter string with single filter and array values', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: [new FilterSpec('auto', ['Mazda       ', null])]
		});

		expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
			'filter={"EQ": {"auto": "Mazda"}}'
		);

		expect(nestedFilter.isAnyFilter()).toEqual(true);
	});

	it('should be created nested filter string with date filter', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: [
				new FilterSpec('auto', 'Mazda       '),
				new FilterSpec(
					'registration',
					new Date('2012-07-28').toISOString(),
					FilterOperator.Equals
				),
				new FilterSpec('dealer.date', new Date('asd'), FilterOperator.Equals),
				new FilterSpec('insured', false, FilterOperator.Equals),
				new FilterSpec('firstOwner', true, FilterOperator.Equals)
			]
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe(
			'filter={"AND": [{"EQ": {"auto": "Mazda"}}, {"EQ": {"registration": "2012-07-28T00:00:00.000Z"}}, {"EQ": {"insured": "false"}}, {"EQ": {"firstOwner": "true"}}]}'
		);
	});

	it('should be created nested filter string', () => {
		const nestedFilter = new NestedFilter({ filterSpecs: filterArrayUser });

		expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
			'filter={"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}'
		);

		// No new instantiation
		expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
			'filter={"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}'
		);
	});

	it('should be created nested filter string with default operator', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe(
			'filter={"AND": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
		);
	});

	it('should be create nested filter inside another filter string', () => {
		const nestedFilterUser = new NestedFilter({
			filterSpecs: filterArrayUser,
			nestingCondition: NestingOperator.And
		});
		const nestedFilterClient = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			innerNestedFilter: nestedFilterUser.buildFilterString()
		}).getHttpParams();

		expect(decodeURI(nestedFilterClient.toString())).toBe(
			'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}'
		);
	});

	it('should be created only main inner nested filter', () => {
		const filterArray = [
			new FilterSpec('   ', '    ', FilterOperator.Like),
			new FilterSpec('user', '', FilterOperator.Like)
		];

		const nestedFilterClient = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or
		});
		const nestedFilterUser = new NestedFilter({
			filterSpecs: filterArray,
			nestingCondition: NestingOperator.And,
			innerNestedFilter: nestedFilterClient.buildFilterString()
		}).getHttpParams();

		expect(decodeURI(nestedFilterUser.toString())).toBe(
			'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
		);
	});

	it('should be created nested filter inside nested string - complex version of setting main filter', () => {
		const filterArrayMoto = [
			new FilterSpec('bike.name', 'Suz', FilterOperator.Like),
			new FilterSpec('bike.company.email', 'Suzuki', FilterOperator.Like)
		];

		// not empty
		const nestedFilterMoto = new NestedFilter({
			filterSpecs: filterArrayMoto,
			nestingCondition: NestingOperator.And
		});

		const filterArrayCar = [
			new FilterSpec('  ', '    ', FilterOperator.Like),
			new FilterSpec('car', '', FilterOperator.Like)
		];

		// empty
		const nestedFilterCar = new NestedFilter({
			filterSpecs: filterArrayCar,
			nestingCondition: NestingOperator.And,
			innerNestedFilter: nestedFilterMoto.buildFilterString()
		});

		// not empty
		const nestedFilterClient = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			innerNestedFilter: nestedFilterCar.buildFilterString()
		});

		const filterArrayUsers = [
			new FilterSpec('user.name', null, FilterOperator.Like),
			new FilterSpec('user.contact.email', '', FilterOperator.Like)
		];

		// empty
		const nestedFilterUsers = new NestedFilter({
			filterSpecs: filterArrayUsers,
			nestingCondition: NestingOperator.And,
			innerNestedFilter: nestedFilterClient.buildFilterString()
		});

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
			)
		];
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArray
		}).getHttpParams();

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
			)
		];
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArray
		}).getHttpParams();

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
			)
		];
		const nestedFilter = new NestedFilter({ filterSpecs: filterArray });

		const nestedFilterClient = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			innerNestedFilter: nestedFilter.buildFilterString()
		});

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
			)
		];
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArray
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe(
			'filter={"AND": [{"user": {"EQ": {"id": ["125", "123", "512"]}}}, {"user": {"LIKE": {"name": ["Toy%", "Maz%", "Jagu%"]}}}]}'
		);
	});

	it('should create empty filter string with filter values in array', () => {
		const filterArray = [
			new FilterSpec('user.id', [null, '', '  '], FilterOperator.Equals),
			new FilterSpec('user.contact.email', null, FilterOperator.Like)
		];
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArray
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe('');
	});

	it('should work with 5 levels of JSON object', () => {
		const filterArray = [
			new FilterSpec('user.id', 12, FilterOperator.Equals),
			new FilterSpec(
				'user.address.city.street.apartment',
				10,
				FilterOperator.GreaterOrEquals
			)
		];
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArray
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe(
			'filter={"AND": [{"user": {"EQ": {"id": "12"}}}, {"user": {"address": {"city": {"street": {"GE": {"apartment": "10"}}}}}}]}'
		);
	});

	it('should be created nested filter string with inclusion of single related resources', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: 'user'
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe(
			'include=user&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
		);
	});

	it('should be created nested filter string with inclusion of multiple related resources', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: ['user', 'car', 'house']
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe(
			'include=user,car,house&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
		);
	});

	it('should be created nested filter string with non inclusion of empty single related resources', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: '  '
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe(
			'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
		);
	});

	it('should be created nested filter string with inclusion of multiple related resources while some are empty', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: ['', '  ', 'house', '  ', 'apartment']
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe(
			'include=house,apartment&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
		);
	});

	it('should be created nested filter string with non inclusion of empty multiple related resources', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: ['  ', ' ', '  ']
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe(
			'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
		);
	});

	it('should be create nested filter with inclusion and single sort param', () => {
		const nestedFilterUser = new NestedFilter({
			filterSpecs: filterArrayUser,
			nestingCondition: NestingOperator.And
		});
		const nestedFilterClient = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: 'client',
			innerNestedFilter: nestedFilterUser.buildFilterString()
		});
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
		const nestedFilterUser = new NestedFilter({
			filterSpecs: filterArrayUser,
			nestingCondition: NestingOperator.And
		});
		const nestedFilterClient = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: ['client', 'house'],
			innerNestedFilter: nestedFilterUser.buildFilterString()
		});
		nestedFilterClient.sortBy([
			new SortSpec('user.name', SortDirection.ASC),
			new SortSpec('user.number', SortDirection.DESC)
		]);

		expect(decodeURI(nestedFilterClient.getHttpParams().toString())).toBe(
			'include=client,house&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}]}&sort=user.name,-user.number'
		);
	});

	it('should be created nested filter string with non inclusion and empty single sort param', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: '  '
		});
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
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: 'client'
		});
		nestedFilter.sortBy([
			new SortSpec('  ', SortDirection.ASC),
			new SortSpec(' ', SortDirection.DESC)
		]);

		expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
			'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}'
		);
	});

	it('should be create nested filter with default pagination specs', () => {
		const nestedFilterUser = new NestedFilter({
			filterSpecs: filterArrayUser,
			nestingCondition: NestingOperator.And
		});
		const nestedFilterClient = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: 'client',
			innerNestedFilter: nestedFilterUser.buildFilterString()
		});
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
		const nestedFilterUser = new NestedFilter({
			filterSpecs: filterArrayUser,
			nestingCondition: NestingOperator.And
		});
		const nestedFilterClient = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: 'client',
			innerNestedFilter: nestedFilterUser.buildFilterString()
		});
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
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: 'client',
			sparseFieldsets: 'client.id'
		});
		nestedFilter.sortBy([
			new SortSpec('  ', SortDirection.ASC),
			new SortSpec(' ', SortDirection.DESC)
		]);

		expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
			'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}&fields=client.id'
		);
	});

	it('should be created nested filter string with multiple sparse fieldsets', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: 'client',
			sparseFieldsets: ['client.id', 'client.name']
		});
		nestedFilter.sortBy([
			new SortSpec('  ', SortDirection.ASC),
			new SortSpec(' ', SortDirection.DESC)
		]);

		expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
			'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}&fields=client.id,client.name'
		);
	});

	it('should be created nested filter string with multiple sparse fieldsets while some are empty strings', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			relatedResources: 'client',
			sparseFieldsets: ['client.id', '   ', 'client.name', '']
		});
		nestedFilter.sortBy([
			new SortSpec('  ', SortDirection.ASC),
			new SortSpec(' ', SortDirection.DESC)
		]);

		expect(decodeURI(nestedFilter.getHttpParams().toString())).toBe(
			'include=client&filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}]}&fields=client.id,client.name'
		);
	});

	it('should be created nested filter string with nullable filter values ', () => {
		const nestedFilter = new NestedFilter({
			filterSpecs: [
				new FilterSpec('auto', null, FilterOperator.Equals, true),
				new FilterSpec('insured', false, FilterOperator.Equals),
				new FilterSpec('firstOwner', 'Dinko', FilterOperator.Equals, false),
				new FilterSpec('secondOwner', null, FilterOperator.Equals, false)
			]
		}).getHttpParams();

		expect(decodeURI(nestedFilter.toString())).toBe(
			'filter={"AND": [{"EQ": {"auto": null}}, {"EQ": {"insured": "false"}}, {"EQ": {"firstOwner": "Dinko"}}]}'
		);
	});

	it('should test if there is any filter and deprecated sorting', () => {
		const filterArray = [
			new FilterSpec('user.id', [1, 2, 3, undefined], FilterOperator.Equals),
			new FilterSpec('user.contact.email', null, FilterOperator.Equals, true),
			new FilterSpec(
				'user.contact.address',
				undefined,
				FilterOperator.Equals,
				true
			),
			new FilterSpec('user.date', new Date('gasfasd'), FilterOperator.Equals),
			new FilterSpec('user.code', null, FilterOperator.Equals, undefined)
		];

		const nestedFilter = new NestedFilter({ filterSpecs: filterArray });
		nestedFilter.sortBy(new SortSpec('', ''));
		nestedFilter.sortBy([]);
		nestedFilter.sortBy(undefined as any);
		expect(nestedFilter.isAnyFilter()).toEqual(true);

		expect(nestedFilter.buildFilterString()).toEqual(
			'{"AND": [{"user": {"EQ": {"id": ["1", "2", "3"]}}}, {"user": {"contact": {"EQ": {"email": null}}}}]}'
		);
		nestedFilter.sortBy(new SortSpec('asc', 'user.id'));
		nestedFilter.sortBy(new SortSpec('desc', 'user.id'));
	});

	it('should be create nested filter with multiple another nested filter strings', () => {
		const nestedFilterUser = new NestedFilter({
			filterSpecs: filterArrayUser,
			nestingCondition: NestingOperator.And
		});

		const nestedFilterCompany = new NestedFilter({
			filterSpecs: [
				new FilterSpec(
					'company.id',
					[1, 2, 3, undefined],
					FilterOperator.Equals
				),
				new FilterSpec('company.contact.email', 'Emil@', FilterOperator.Like),
				new FilterSpec(
					'company.code',
					[15153, , , undefined, '651515', '  ', 4121, , '', null, 'IBM'],
					FilterOperator.Equals
				)
			]
		});

		const nestedFilterClient = new NestedFilter({
			filterSpecs: filterArrayClient,
			nestingCondition: NestingOperator.Or,
			innerNestedFilter: [
				nestedFilterUser.buildFilterString(),
				nestedFilterCompany.buildFilterString()
			]
		}).getHttpParams();

		expect(decodeURI(nestedFilterClient.toString())).toBe(
			'filter={"OR": [{"client": {"EQ": {"id": "16512"}}}, {"client": {"LIKE": {"name": "Jag%"}}}, {"AND": [{"user": {"GE": {"number": "30000"}}}, {"user": {"LIKE": {"name": "Emil%"}}}, {"user": {"contact": {"LIKE": {"email": "Emil@%"}}}}]}, {"AND": [{"company": {"EQ": {"id": ["1", "2", "3"]}}}, {"company": {"contact": {"LIKE": {"email": "Emil@%"}}}}, {"company": {"EQ": {"code": ["15153", "651515", "4121", "IBM"]}}}]}]}'
		);
	});
});
