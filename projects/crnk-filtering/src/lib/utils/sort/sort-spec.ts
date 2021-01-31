import { SortDirection } from './sort-direction';

export class SortSpec {
  public sortParam = '';

  constructor(sortPathSpec: string, direction: SortDirection | string) {
    sortPathSpec = sortPathSpec ? sortPathSpec.trim() : '';
    direction = direction ? direction.trim() : '';

    if (sortPathSpec && direction) {
      this.sortParam = direction === 'asc' ? sortPathSpec : '-' + sortPathSpec;
    }
  }
}
