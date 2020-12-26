import { FilterSpec } from '../FilterSpec';
import { FilterOperator } from '../utils/crnk-operators';
import { BasicFilter } from './BasicFilter';

describe('Basic-filtering', () => {
  it('should be create string with one filter', () => {
    const filterArray = [
      new FilterSpec('user.name', 'Auto', FilterOperator.Like),
    ];
    const basicFilter = new BasicFilter(filterArray).getHttpParams();

    expect(decodeURI(basicFilter.toString())).toBe(
      'filter[user.name][LIKE]=Auto%'
    );
  });

  it('should be create string with two filters', () => {
    const filterArray = [
      new FilterSpec('user.name', 'Auto', FilterOperator.Like),
      new FilterSpec('user.number', '265112', FilterOperator.Equals),
    ];
    const basicFilter = new BasicFilter(filterArray).getHttpParams();

    expect(decodeURI(basicFilter.toString())).toBe(
      'filter[user.name][LIKE]=Auto%&filter[user.number][EQ]=265112'
    );
  });

  it('should not create filter string with null, undefined and empty values', () => {
    const filterArray = [
      new FilterSpec('user.name', '    ', 'LIKE'),
      new FilterSpec('user.number', '', 'EQ'),
      new FilterSpec('user.address.city', null, 'EQ'),
      new FilterSpec('user.address.zip', undefined, 'EQ'),
    ];
    const basicFilter = new BasicFilter(filterArray).getHttpParams();

    expect(decodeURI(basicFilter.toString())).toBe('');
  });

  it('should recognize empty and non empty filter values', () => {
    const filterArray = [
      new FilterSpec('user.name', '    ', 'LIKE'),
      new FilterSpec('user.number', '132312', 'EQ'),
      new FilterSpec('user.address.city', null, 'EQ'),
      new FilterSpec('user.address.zip', 32115, 'EQ'),
    ];
    const basicFilter = new BasicFilter(filterArray).getHttpParams();

    expect(decodeURI(basicFilter.toString())).toBe(
      'filter[user.number][EQ]=132312&filter[user.address.zip][EQ]=32115'
    );
  });

  it('should work with filter values in array', () => {
    const filterArray = [
      new FilterSpec('user.name', '    ', 'LIKE'),
      new FilterSpec(
        'user.number',
        [13513, undefined, 23151, , 21512, null],
        'EQ'
      ),
      new FilterSpec('user.address.city', ['Zurich', 'Ljubljana', 'Novi Sad']),
      new FilterSpec(
        'user.address.street',
        ['Gustav     ', 'Kaiser', '  StraĂźe '],
        'LIKE'
      ),
    ];
    const basicFilter = new BasicFilter(filterArray).getHttpParams();

    expect(decodeURI(basicFilter.toString())).toBe(
      'filter[user.number][EQ]=13513,23151,21512&filter[user.address.city][EQ]=Zurich,Ljubljana,Novi Sad&filter[user.address.street][LIKE]=Gustav%,Kaiser%,StraĂźe%'
    );
  });
});
