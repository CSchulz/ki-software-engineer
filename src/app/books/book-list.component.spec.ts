import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, throwError } from 'rxjs';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookListComponent } from './book-list.component';

const angularBook: Book = {
  id: 'angular-20',
  isbn: '978-1-23456-789-0',
  title: 'Modern Angular',
  author: 'Ada Developer',
  publisher: 'Blue Press',
  numPages: 320,
  price: '39.90',
  cover: '',
  abstract: 'A practical guide.',
  userId: 1
};

class BookApiClientStub {
  getBooks = jasmine.createSpy<(pageSize: number, searchTerm?: string) => Observable<Book[]>>();
}

describe('BookListComponent', () => {
  let fixture: ComponentFixture<BookListComponent>;
  let apiClient: BookApiClientStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookListComponent],
      providers: [provideRouter([]), { provide: BookApiClient, useClass: BookApiClientStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(BookListComponent);
    apiClient = TestBed.inject(BookApiClient) as unknown as BookApiClientStub;
  });

  it('cancels an older request when a newer search starts', fakeAsync(() => {
    const initialResult = new Subject<Book[]>();
    const searchResult = new Subject<Book[]>();
    let initialRequestCancelled = false;

    apiClient.getBooks.and.callFake((_pageSize, searchTerm) => {
      if (searchTerm === 'modern') {
        return searchResult;
      }

      return new Observable(subscriber => {
        const subscription = initialResult.subscribe(subscriber);
        return () => {
          initialRequestCancelled = true;
          subscription.unsubscribe();
        };
      });
    });

    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'modern';
    input.dispatchEvent(new Event('input'));
    tick(300);

    expect(initialRequestCancelled).toBeTrue();

    searchResult.next([angularBook]);
    searchResult.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Modern Angular');
  }));

  it('shows an explicit error state when loading books fails', fakeAsync(() => {
    apiClient.getBooks.and.returnValue(throwError(() => new Error('offline')));

    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert?.textContent).toContain('Unable to load books');
    expect(alert?.textContent).toContain('Try again');
  }));
});
