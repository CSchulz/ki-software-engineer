import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, concat, defer, map, of, shareReplay } from 'rxjs';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';

type BookDetailViewModel =
  | { status: 'loading' }
  | { status: 'success'; book: Book }
  | { status: 'not-found' }
  | { status: 'error' };

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './book-detail.component.html'
})
export class BookDetailComponent {
  readonly vm$ = defer(() => {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return of<BookDetailViewModel>({ status: 'not-found' });
    }

    return concat(
      of<BookDetailViewModel>({ status: 'loading' }),
      this.bookApiClient.getBookById(id).pipe(
        map(book =>
          book
            ? ({ status: 'success', book } satisfies BookDetailViewModel)
            : ({ status: 'not-found' } satisfies BookDetailViewModel)
        ),
        catchError((error: HttpErrorResponse) =>
          of<BookDetailViewModel>({ status: error.status === 404 ? 'not-found' : 'error' })
        )
      )
    );
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly bookApiClient: BookApiClient
  ) {}
}
