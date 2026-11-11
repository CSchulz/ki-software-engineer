import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, CanDeactivateFn, Router } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, Subject, defer, map, of, shareReplay, startWith, take } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ToastService } from '../shared/toast.service';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';

type BookEditViewModel =
  | { status: 'loading' }
  | { status: 'success'; book: Book }
  | { status: 'not-found' }
  | { status: 'error' };

@Component({
  selector: 'app-book-edit',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, ReactiveFormsModule],
  templateUrl: './book-edit.component.html'
})
export class BookEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookApiClient = inject(BookApiClient);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    author: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\p{L}+$/u)]
    }),
    subtitle: new FormControl('', { nonNullable: true }),
    cover: new FormControl('', { nonNullable: true }),
    abstract: new FormControl('', { nonNullable: true })
  });

  readonly saveState = signal<'idle' | 'saving'>('idle');
  readonly warningVisible = signal(false);

  private book: Book | null = null;
  private pendingNavigation: Subject<boolean> | null = null;
  private readonly originUrl = this.router.getCurrentNavigation()?.previousNavigation?.finalUrl?.toString() ?? '/';

  readonly vm$ = defer(() => {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return of<BookEditViewModel>({ status: 'not-found' });
    }

    return this.bookApiClient.getBookById(id).pipe(
      tap(book => this.initializeForm(book)),
      map(book => ({ status: 'success', book }) satisfies BookEditViewModel),
      catchError((error: HttpErrorResponse) =>
        of<BookEditViewModel>({ status: error.status === 404 ? 'not-found' : 'error' })
      ),
      startWith({ status: 'loading' } satisfies BookEditViewModel)
    );
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  save(): void {
    if (!this.book || this.form.invalid || this.saveState() === 'saving') {
      this.form.markAllAsTouched();
      return;
    }

    this.saveState.set('saving');
    this.bookApiClient
      .updateBook(this.book.id, this.form.getRawValue())
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updatedBook => {
          this.book = updatedBook;
          this.form.markAsPristine();
          this.saveState.set('idle');
          void this.router.navigate(['/books', updatedBook.id]);
        },
        error: () => {
          this.saveState.set('idle');
          this.toast.show('Unable to save book. Please try again.', 0);
        }
      });
  }

  cancel(): void {
    void this.router.navigateByUrl(this.originUrl);
  }

  canDeactivate(): boolean | Observable<boolean> {
    return this.form.dirty ? this.requestNavigationConfirmation() : true;
  }

  resolveNavigation(proceed: boolean): void {
    this.warningVisible.set(false);
    this.pendingNavigation?.next(proceed);
    this.pendingNavigation?.complete();
    this.pendingNavigation = null;
  }

  private requestNavigationConfirmation(): Observable<boolean> {
    if (!this.pendingNavigation) {
      this.pendingNavigation = new Subject<boolean>();
      this.warningVisible.set(true);
    }

    return this.pendingNavigation.asObservable();
  }

  private initializeForm(book: Book): void {
    this.book = book;
    this.form.reset({
      title: book.title,
      author: book.author,
      subtitle: book.subtitle ?? '',
      cover: book.cover,
      abstract: book.abstract
    });
  }
}

export const bookEditCanDeactivate: CanDeactivateFn<BookEditComponent> = component => component.canDeactivate();
