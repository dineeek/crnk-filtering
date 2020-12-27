import { SortDirection } from './sort-direction';

export class SortParam {
  public sortParam: any = null;

  constructor(path: string, direction: SortDirection) {
    if (path.trim()) {
      this.sortParam = direction === SortDirection.ASC ? path : '-' + path;
    }
  }
}
