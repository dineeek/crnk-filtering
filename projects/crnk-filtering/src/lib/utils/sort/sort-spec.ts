import { SortDirection } from './sort-direction';

export class SortSpec {
  public sortParam = '';

  constructor(sortPathSpec: string, direction: SortDirection) {
    sortPathSpec = sortPathSpec ? sortPathSpec.trim() : '';

    if (sortPathSpec && direction) {
      this.sortParam =
        direction === SortDirection.ASC ? sortPathSpec : '-' + sortPathSpec;
    }
  }
}
