import { HttpParams } from '@angular/common/http';
import { PageEvent } from '@angular/material/paginator';

export class PaginationSpec {
	public pageEvent: PageEvent;

	private pageIndex: number;
	private pageSize: number;
	private length: number;

	public constructor(pageIndex?: number, pageSize?: number, length?: number) {
		this.pageIndex = pageIndex ? pageIndex : 0;
		this.pageSize = pageSize ? pageSize : 10;
		this.length = length ? length : 0;

		this.pageEvent = new PageEvent();
		this.resetPaginator();
	}

	setPagination(pageEvent: PageEvent): void {
		this.pageEvent = pageEvent;
	}

	getHttpParams(): HttpParams {
		return this.setHttpParams(new HttpParams());
	}

	setHttpParams(httpParams: HttpParams): HttpParams {
		if (this.pageEvent) {
			httpParams = httpParams.set(
				'page[limit]',
				String(this.pageEvent.pageSize)
			);

			httpParams = httpParams.set(
				'page[offset]',
				String(this.pageEvent.pageIndex * this.pageEvent.pageSize)
			);
		}

		return httpParams;
	}

	resetPaginator(): void {
		this.pageEvent.pageIndex = this.pageIndex;
		this.pageEvent.pageSize = this.pageSize;
		this.pageEvent.length = this.length;
	}
}
