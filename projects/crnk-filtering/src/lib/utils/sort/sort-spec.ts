import { SortDirection } from './sort-direction';

export class SortSpec {
  public sortParam = '';

  constructor(sortPathSpec: string, direction: SortDirection) {
    if (sortPathSpec.trim()) {
      this.sortParam =
        direction === SortDirection.ASC ? sortPathSpec : '-' + sortPathSpec;
    }
  }
}
