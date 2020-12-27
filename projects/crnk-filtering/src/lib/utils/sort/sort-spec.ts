import { SortDirection } from './sort-direction';

export interface SortSpec {
  pathSpec: string;
  direction: SortDirection;
}
