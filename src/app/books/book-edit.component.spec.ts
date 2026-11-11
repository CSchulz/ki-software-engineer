import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, of, Subject, throwError } from 'rxjs';
import { routes } from '../app.routes';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';

const completeBook: Book = {
  id: 'angular-20',
  isbn: '978-1-23456-789-0',
  title: 'Modern Angular',
  subtitle: 'Standalone from the start',
  author: 'AdaDeveloper',
  publisher: 'Blue Press',
  numPages: 320,
  price: '39.90',
  cover: 'https://example.test/angular.jpg',
  abstract: 'A practical guide to building accessible Angular applications.',
  userId: 1
};

class BookApiClientStub {
  currentBook = completeBook;
  getBooks = jasmine
    .createSpy<(pageSize: number, searchTerm?: string) => Observable<Book[]>>('getBooks')
    .and.callFake(() => of([this.currentBook]));
  getBookById = jasmine
    .createSpy<(id: string) => Observable<Book>>('getBookById')
    .and.callFake(() => of(this.currentBook));
  updateBook = jasmine
    .createSpy('updateBook')
    .and.callFake((bookOrId: string | Partial<Book>, changes?: Partial<Book>): Observable<Book> => {
      const submittedBook = typeof bookOrId === 'string' ? changes : bookOrId;
      this.currentBook = { ...this.currentBook, ...submittedBook };
      return of(this.currentBook);
    });
}

describe('book edit acceptance criteria', () => {
  let apiClient: BookApiClientStub;
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    apiClient = new BookApiClientStub();

    TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [provideRouter(routes), provideNoopAnimations(), { provide: BookApiClient, useValue: apiClient }]
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  afterEach(() => TestBed.inject(MatSnackBar).dismiss());

  async function openEditor(): Promise<HTMLElement> {
    await harness.navigateByUrl(`/books/${completeBook.id}/edit`);
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  async function settle(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
    harness.detectChanges();
  }

  function control<T extends HTMLInputElement | HTMLTextAreaElement>(
    root: ParentNode,
    name: 'title' | 'author' | 'subtitle' | 'cover' | 'abstract' | 'isbn'
  ): T | null {
    const element = root.querySelector<T>(`[name="${name}"], [formcontrolname="${name}"]`);
    expect(element).withContext(`the ${name} control should be present`).not.toBeNull();
    return element;
  }

  function button(root: ParentNode, label: string): HTMLButtonElement | null {
    const element = Array.from(root.querySelectorAll('button')).find(
      candidate => candidate.textContent?.trim() === label
    ) as HTMLButtonElement | undefined;
    expect(element).withContext(`the ${label} button should be present`).toBeDefined();
    return element ?? null;
  }

  function enterValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    element.value = value;
    element.dispatchEvent(new Event('input'));
    harness.detectChanges();
  }

  it('AC: allows editing supported fields while keeping ISBN immutable', async () => {
    const element = await openEditor();
    const title = control<HTMLInputElement>(element, 'title');
    const author = control<HTMLInputElement>(element, 'author');
    const subtitle = control<HTMLInputElement>(element, 'subtitle');
    const cover = control<HTMLInputElement>(element, 'cover');
    const abstract = control<HTMLTextAreaElement>(element, 'abstract');
    const isbn = element.querySelector<HTMLInputElement>('[name="isbn"], [formcontrolname="isbn"]');

    if (!title || !author || !subtitle || !cover || !abstract) return;

    expect(title.value).toBe('Modern Angular');
    expect(author.value).toBe('AdaDeveloper');
    expect(subtitle.value).toBe('Standalone from the start');
    expect(cover.value).toBe('https://example.test/angular.jpg');
    expect(abstract.value).toBe('A practical guide to building accessible Angular applications.');
    expect(title.disabled).toBeFalse();
    expect(author.disabled).toBeFalse();
    expect(subtitle.disabled).toBeFalse();
    expect(cover.disabled).toBeFalse();
    expect(abstract.disabled).toBeFalse();
    expect(!isbn || isbn.disabled || isbn.readOnly)
      .withContext('ISBN must not be editable')
      .toBeTrue();
  });

  it('AC: rejects saving when title or author is empty', async () => {
    const element = await openEditor();
    const title = control<HTMLInputElement>(element, 'title');
    const author = control<HTMLInputElement>(element, 'author');
    const save = button(element, 'Save');

    if (!title || !author || !save) return;

    enterValue(title, '');
    enterValue(author, '');

    expect(title.getAttribute('aria-invalid')).toBe('true');
    expect(author.getAttribute('aria-invalid')).toBe('true');
    expect(save.disabled).toBeTrue();
  });

  it('AC: rejects an author containing non-letter characters', async () => {
    const element = await openEditor();
    const author = control<HTMLInputElement>(element, 'author');
    const save = button(element, 'Save');

    if (!author || !save) return;

    enterValue(author, 'Ada2');

    expect(author.getAttribute('aria-invalid')).toBe('true');
    expect(save.disabled).toBeTrue();
  });

  it('AC: accepts empty subtitle, cover, and abstract', async () => {
    const element = await openEditor();
    const subtitle = control<HTMLInputElement>(element, 'subtitle');
    const cover = control<HTMLInputElement>(element, 'cover');
    const abstract = control<HTMLTextAreaElement>(element, 'abstract');
    const save = button(element, 'Save');

    if (!subtitle || !cover || !abstract || !save) return;

    enterValue(subtitle, '');
    enterValue(cover, '');
    enterValue(abstract, '');

    expect(save.disabled).toBeFalse();
  });

  it('AC: navigates to updated details after a successful save', async () => {
    const element = await openEditor();
    const title = control<HTMLInputElement>(element, 'title');
    const save = button(element, 'Save');

    if (!title || !save) return;

    enterValue(title, 'Refined Angular');
    save.click();
    await settle();

    expect(router.url).toBe('/books/angular-20');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Refined Angular');
  });

  it('AC: shows saving status and prevents duplicate submission', async () => {
    const pendingSave = new Subject<Book>();
    apiClient.updateBook.and.returnValue(pendingSave);
    const element = await openEditor();
    const title = control<HTMLInputElement>(element, 'title');
    const save = button(element, 'Save');

    if (!title || !save) return;

    enterValue(title, 'Refined Angular');
    save.click();
    harness.detectChanges();

    expect(element.querySelector('[role="status"]')?.textContent).toContain('Saving');
    expect(save.disabled).toBeTrue();

    save.click();
    expect(apiClient.updateBook).toHaveBeenCalledTimes(1);
  });

  it('AC: shows a snackbar and preserves input after save failure', async () => {
    apiClient.updateBook.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
    );
    const element = await openEditor();
    const title = control<HTMLInputElement>(element, 'title');
    const save = button(element, 'Save');

    if (!title || !save) return;

    enterValue(title, 'Refined Angular');
    save.click();
    await settle();

    const snackbarMessage = document.body.querySelector('.mat-mdc-snack-bar-label')?.textContent?.trim();
    expect(snackbarMessage?.length).withContext('a snackbar error message should be visible').toBeGreaterThan(0);
    expect(title.value).toBe('Refined Angular');
    expect(router.url).toBe('/books/angular-20/edit');
    expect(save.disabled).toBeFalse();
  });

  it('AC: returns to the originating list or detail view without saving', async () => {
    await harness.navigateByUrl('/');
    await harness.navigateByUrl('/books/angular-20/edit');
    harness.detectChanges();
    let cancel = button(harness.routeNativeElement as HTMLElement, 'Cancel');

    if (!cancel) return;

    cancel.click();
    await settle();
    expect(router.url).toBe('/');

    await harness.navigateByUrl('/books/angular-20');
    await harness.navigateByUrl('/books/angular-20/edit');
    harness.detectChanges();
    cancel = button(harness.routeNativeElement as HTMLElement, 'Cancel');

    if (!cancel) return;

    cancel.click();
    await settle();
    expect(router.url).toBe('/books/angular-20');
  });

  it('AC: warns before leaving with unsaved changes', async () => {
    const element = await openEditor();
    const title = control<HTMLInputElement>(element, 'title');

    if (!title) return;

    enterValue(title, 'Refined Angular');
    void router.navigateByUrl('/');
    await Promise.resolve();
    harness.detectChanges();

    expect(button(document.body, 'Weiter')).not.toBeNull();
    expect(button(document.body, 'Abbrechen')).not.toBeNull();
  });

  it('AC: discards changes and leaves when the warning is continued', async () => {
    const element = await openEditor();
    const title = control<HTMLInputElement>(element, 'title');

    if (!title) return;

    enterValue(title, 'Refined Angular');
    const navigation = router.navigateByUrl('/');
    await Promise.resolve();
    harness.detectChanges();
    const proceed = button(document.body, 'Weiter');

    if (!proceed) return;

    proceed.click();
    await navigation;
    await settle();

    expect(router.url).toBe('/');
  });

  it('AC: keeps inputs and stays when the warning is cancelled', async () => {
    const element = await openEditor();
    const title = control<HTMLInputElement>(element, 'title');

    if (!title) return;

    enterValue(title, 'Refined Angular');
    const navigation = router.navigateByUrl('/');
    await Promise.resolve();
    harness.detectChanges();
    const stay = button(document.body, 'Abbrechen');

    if (!stay) return;

    stay.click();
    await navigation;
    await settle();

    expect(router.url).toBe('/books/angular-20/edit');
    expect(title.value).toBe('Refined Angular');
  });

  it('AC: reuses the book-not-found state when the editable book is missing', async () => {
    apiClient.getBookById.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))
    );

    const element = await openEditor();

    expect(element.querySelector('[role="alert"] h1')?.textContent).toContain('Book not found');
  });
});
