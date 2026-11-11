import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';
import { routes } from '../app.routes';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookDetailComponent } from './book-detail.component';

const completeBook: Book = {
  id: 'angular-20',
  isbn: '978-1-23456-789-0',
  title: 'Modern Angular',
  subtitle: 'Standalone from the start',
  author: 'Ada Developer',
  publisher: 'Blue Press',
  numPages: 320,
  price: '39.90',
  cover: 'https://example.test/angular.jpg',
  abstract: 'A practical guide to building accessible Angular applications.',
  userId: 1
};

class BookApiClientStub {
  getBookById = jasmine.createSpy<(id: string) => Observable<Book>>().and.returnValue(of(completeBook));
}

describe('BookDetailComponent', () => {
  let fixture: ComponentFixture<BookDetailComponent>;
  let apiClient: BookApiClientStub;

  async function createComponent(result: Observable<Book>): Promise<HTMLElement> {
    apiClient.getBookById.and.returnValue(result);
    fixture = TestBed.createComponent(BookDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookDetailComponent],
      providers: [
        provideRouter([]),
        { provide: BookApiClient, useClass: BookApiClientStub },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: completeBook.id }) } }
        }
      ]
    }).compileComponents();

    apiClient = TestBed.inject(BookApiClient) as unknown as BookApiClientStub;
  });

  it('renders all book details returned by the API', async () => {
    const element = await createComponent(of(completeBook));

    expect(apiClient.getBookById).toHaveBeenCalledOnceWith(completeBook.id);
    expect(element.querySelector('h1')?.textContent).toContain(completeBook.title);
    expect(element.textContent).toContain(completeBook.subtitle!);
    expect(element.textContent).toContain(completeBook.author);
    expect(element.textContent).toContain(completeBook.publisher);
    expect(element.textContent).toContain(completeBook.isbn);
    expect(element.textContent).toContain(String(completeBook.numPages));
    expect(element.textContent).toContain(completeBook.price);
    expect(element.textContent).toContain(completeBook.abstract);
    expect(element.querySelector('img')?.getAttribute('alt')).toBe(`Cover of ${completeBook.title}`);
    expect(element.querySelector<HTMLAnchorElement>('a[href="/"]')?.textContent).toContain('Back to Books');
  });

  it('uses useful fallbacks when optional content and the cover are missing', async () => {
    const element = await createComponent(of({ ...completeBook, subtitle: undefined, cover: '', abstract: '' }));

    expect(element.textContent).not.toContain('Standalone from the start');
    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toContain('No cover available');
    expect(element.textContent).toContain('No abstract available');
  });

  it('shows a distinct loading state while the request is pending', async () => {
    const element = await createComponent(NEVER);

    expect(element.querySelector('[role="status"]')?.textContent).toContain('Loading book details');
    expect(element.querySelector('article')).toBeNull();
  });

  it('shows a missing-book state for a 404 response', async () => {
    const element = await createComponent(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))
    );

    expect(element.querySelector('[role="alert"] h1')?.textContent).toContain('Book not found');
    expect(element.textContent).toContain('Back to Books');
  });

  it('shows an API-error state for other request failures', async () => {
    const element = await createComponent(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
    );

    expect(element.querySelector('[role="alert"] h1')?.textContent).toContain('Unable to load book details');
    expect(element.textContent).toContain('try again later');
  });

  it('AC: exposes an edit link from book details to the shared edit route', async () => {
    const element = await createComponent(of(completeBook));
    const editLink = element.querySelector('a[href="/books/angular-20/edit"]') as HTMLAnchorElement | null;

    expect(editLink).withContext('an edit link should be rendered for the displayed book').not.toBeNull();
    if (!editLink) return;

    expect(editLink?.textContent).withContext('the edit link should have an accessible name').toContain('Edit');
  });
});

describe('book detail route', () => {
  it('supports direct navigation to /books/:id', async () => {
    const apiClient = new BookApiClientStub();

    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: BookApiClient, useValue: apiClient }]
    });

    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/books/angular-20', BookDetailComponent);

    expect(component).toBeTruthy();
    expect(apiClient.getBookById).toHaveBeenCalledOnceWith('angular-20');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Modern Angular');
  });
});
