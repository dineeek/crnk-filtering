import { SortDirection } from './operators';

export class SortSpec {
  public readonly sortParam: string;

  constructor(sortPathSpec: string, direction: SortDirection | string) {
    const path = sortPathSpec?.trim() ?? '';
    const dir = typeof direction === 'string' ? direction.trim() : '';

    if (path && dir) {
      this.sortParam = dir === SortDirection.ASC ? path : `-${path}`;
    } else {
      this.sortParam = '';
    }
  }
}

