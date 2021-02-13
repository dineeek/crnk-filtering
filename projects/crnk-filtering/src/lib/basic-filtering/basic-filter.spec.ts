import { FilterSpec } from '../filter-specification/FilterSpec';
import { FilterOperator } from '../utils/crnk-operators';
import { PaginationSpec } from '../utils/pagination/pagination-spec';
import { SortDirection } from '../utils/sort/sort-direction';
import { SortSpec } from '../utils/sort/sort-spec';
import { BasicFilter } from './BasicFilter';

describe('Basic-filtering', () => {
	it('should be create string with one filter', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Auto', FilterOperator.Like)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray
		}).getHttpParams();

		expect(decodeURI(basicFilter.toString())).toBe(
			'filter[user.name][LIKE]=Auto%'
		);
	});

	it('should be create string with two filters', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Auto', FilterOperator.Like),
			new FilterSpec('user.number', '265112', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({ filterSpecs: filterArray });

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Auto%&filter[user.number][EQ]=265112'
		);

		// No new instantiation
		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Auto%&filter[user.number][EQ]=265112'
		);
	});

	it('should not create filter string with null, undefined and empty values', () => {
		const filterArray = [
			new FilterSpec('user', '    ', FilterOperator.Like),
			new FilterSpec('   ', '', FilterOperator.Equals),
			new FilterSpec('user.address.city', null, FilterOperator.Equals),
			new FilterSpec('user.address.zip', undefined, FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray
		}).getHttpParams();

		expect(decodeURI(basicFilter.toString())).toBe('');
	});

	it('should recognize empty and non empty filter values', () => {
		const filterArray = [
			new FilterSpec('user.name', '    ', FilterOperator.Like),
			new FilterSpec('user.number', '132312', FilterOperator.Equals),
			new FilterSpec('user.address.city', NaN, FilterOperator.Equals),
			new FilterSpec('user.address.zip', 32115, FilterOperator.Equals),
			new FilterSpec('insured', false, FilterOperator.Equals),
			new FilterSpec('firstOwner', null, FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray
		}).getHttpParams();

		expect(decodeURI(basicFilter.toString())).toBe(
			'filter[user.number][EQ]=132312&filter[user.address.zip][EQ]=32115&filter[insured][EQ]=false'
		);
	});

	it('should work with filter values in array', () => {
		const filterArray = [
			new FilterSpec('user.name', '    ', FilterOperator.Like),
			new FilterSpec(
				'user.number',
				[13513, undefined, 23151, , 21512, null, NaN],
				FilterOperator.Equals
			),
			new FilterSpec('user.address.city', ['Zurich', 'Ljubljana', 'Novi Sad']),
			new FilterSpec(
				'user.address.street',
				['Gustav     ', 'Kaiser', '  Strasse '],
				FilterOperator.Like
			)
		];
		const basicFilter = new BasicFilter({ filterSpecs: filterArray });

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.number][EQ]=13513,23151,21512&filter[user.address.city][EQ]=Zurich,Ljubljana,Novi Sad&filter[user.address.street][LIKE]=Gustav%,Kaiser%,Strasse%'
		);

		// No new instantiation
		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.number][EQ]=13513,23151,21512&filter[user.address.city][EQ]=Zurich,Ljubljana,Novi Sad&filter[user.address.street][LIKE]=Gustav%,Kaiser%,Strasse%'
		);
	});

	it('should create filter string with one sort param', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Dino', FilterOperator.Like),
			new FilterSpec('user.number', '14141', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({ filterSpecs: filterArray });
		basicFilter.sortBy(new SortSpec('user.name', SortDirection.DESC));

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Dino%&filter[user.number][EQ]=14141&sort=-user.name'
		);
	});

	it('should create filter string with multiple sort param', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({ filterSpecs: filterArray });
		basicFilter.sortBy([
			new SortSpec('user.name', SortDirection.DESC),
			new SortSpec('user.number', SortDirection.ASC)
		]);

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-user.name,user.number'
		);

		// No new instantiation
		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-user.name,user.number'
		);
	});

	it('should create filter string with one sort param while second param is empty', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({ filterSpecs: filterArray });
		basicFilter.sortBy([
			new SortSpec('  ', SortDirection.DESC),
			new SortSpec('user.number', SortDirection.ASC)
		]);

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=user.number'
		);
	});

	it('should create filter string with non sort param - empty sorting path spec', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({ filterSpecs: filterArray });
		basicFilter.sortBy([
			new SortSpec('', SortDirection.DESC),
			new SortSpec('   ', SortDirection.ASC)
		]);

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123'
		);
	});

	it('should create filter string with inclusion of related resource', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray,
			relatedResources: 'client'
		});
		basicFilter.sortBy(new SortSpec('client.name', SortDirection.DESC));

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-client.name'
		);
	});

	it('should create filter string without inclusion of related resource', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray,
			relatedResources: ' '
		});
		basicFilter.sortBy(new SortSpec('client.name', SortDirection.DESC));

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-client.name'
		);
	});

	it('should create filter string with inclusion of multiple related resources', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray,
			relatedResources: ['client', 'car', ' ']
		});
		basicFilter.sortBy(new SortSpec('client.name', SortDirection.ASC));

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'include=client,car&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=client.name'
		);
	});

	it('should create filter string without inclusion of multiple related resources', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray,
			relatedResources: []
		});
		basicFilter.sortBy(new SortSpec('user.name', SortDirection.DESC));

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-user.name'
		);
	});

	it('should create filter string without inclusion of multiple empty related resources', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray,
			relatedResources: ['  ', '', '    ']
		});
		basicFilter.sortBy(new SortSpec('user.name', SortDirection.ASC));

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=user.name'
		);
	});

	it('should create filter string with default pagination specs', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray,
			relatedResources: 'client'
		});
		basicFilter.sortBy(new SortSpec('client.name', SortDirection.DESC));

		const paginationSpec = new PaginationSpec();

		expect(
			decodeURI(
				paginationSpec.setHttpParams(basicFilter.getHttpParams()).toString()
			)
		).toBe(
			'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-client.name&page[limit]=10&page[offset]=0'
		);
	});

	it('should create filter string with custom pagination specs', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray,
			relatedResources: 'client'
		});
		basicFilter.sortBy(new SortSpec('client.name', SortDirection.DESC));

		const paginationSpec = new PaginationSpec(2, 20, 0);

		expect(
			decodeURI(
				paginationSpec.setHttpParams(basicFilter.getHttpParams()).toString()
			)
		).toBe(
			'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&sort=-client.name&page[limit]=20&page[offset]=40'
		);
	});

	it('should create filter string with single sparse fieldset', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray,
			relatedResources: 'client',
			sparseFieldsets: 'user.name'
		});
		basicFilter.sortBy(new SortSpec('client.name', SortDirection.DESC));

		const paginationSpec = new PaginationSpec();

		expect(
			decodeURI(
				paginationSpec.setHttpParams(basicFilter.getHttpParams()).toString()
			)
		).toBe(
			'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&fields=user.name&sort=-client.name&page[limit]=10&page[offset]=0'
		);
	});

	it('should create filter string with multiple sparse fieldset', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray,
			relatedResources: 'client',
			sparseFieldsets: ['user.name', 'user.number']
		});
		basicFilter.sortBy(new SortSpec('client.name', SortDirection.DESC));

		const paginationSpec = new PaginationSpec();

		expect(
			decodeURI(
				paginationSpec.setHttpParams(basicFilter.getHttpParams()).toString()
			)
		).toBe(
			'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&fields=user.name,user.number&sort=-client.name&page[limit]=10&page[offset]=0'
		);
	});

	it('should create filter string with multiple sparse fieldset while some are empty strings', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Gustav', FilterOperator.Like),
			new FilterSpec('user.number', '14123', FilterOperator.Equals)
		];
		const basicFilter = new BasicFilter({
			filterSpecs: filterArray,
			relatedResources: 'client',
			sparseFieldsets: ['user.name', '  ', 'user.number', '  ']
		});
		basicFilter.sortBy(new SortSpec('client.name', SortDirection.DESC));

		const paginationSpec = new PaginationSpec();

		expect(
			decodeURI(
				paginationSpec.setHttpParams(basicFilter.getHttpParams()).toString()
			)
		).toBe(
			'include=client&filter[user.name][LIKE]=Gustav%&filter[user.number][EQ]=14123&fields=user.name,user.number&sort=-client.name&page[limit]=10&page[offset]=0'
		);
	});

	it('should be create string with nullable filters values', () => {
		const filterArray = [
			new FilterSpec('user.name', 'Auto', FilterOperator.Like),
			new FilterSpec('user.number', null, FilterOperator.Equals, true),
			new FilterSpec('user.address', 'Strasse', FilterOperator.Like),
			new FilterSpec('user.shortname', null, FilterOperator.Equals, false)
		];
		const basicFilter = new BasicFilter({ filterSpecs: filterArray });

		expect(decodeURI(basicFilter.getHttpParams().toString())).toBe(
			'filter[user.name][LIKE]=Auto%&filter[user.number][EQ]=null&filter[user.address][LIKE]=Strasse%'
		);
	});
});
