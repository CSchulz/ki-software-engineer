import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, concat, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookItemComponent } from './book-item.component';

type BookListViewModel =
  | { status: 'loading' }
  | { status: 'success'; books: Book[] }
  | { status: 'error' };

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BookItemComponent],
  templateUrl: './book-list.component.html'
})
export class BookListComponent {
  @Input() pageSize = 10;
  readonly searchTerm = new FormControl('', { nonNullable: true });
  private readonly reload = new Subject<void>();

  readonly vm$ = combineLatest([
    this.searchTerm.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
    this.reload.pipe(startWith(undefined))
  ]).pipe(
    switchMap(([searchTerm]) =>
      concat(
        of<BookListViewModel>({ status: 'loading' }),
        this.bookApiClient.getBooks(this.pageSize, searchTerm || undefined).pipe(
          map(books => ({ status: 'success', books }) satisfies BookListViewModel),
          catchError(() => of<BookListViewModel>({ status: 'error' }))
        )
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private readonly bookApiClient: BookApiClient) {}

  clearSearch(): void {
    this.searchTerm.setValue('');
  }

  retry(): void {
    this.reload.next();
  }

  trackById(index: number, book: Book): string {
    return book.id;
  }
}
