import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';

describe('BookApiClient', () => {
  let client: BookApiClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookApiClient, provideHttpClient(), provideHttpClientTesting()]
    });

    client = TestBed.inject(BookApiClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads a book by id from the individual book endpoint', () => {
    const book: Book = {
      id: 'angular-20',
      isbn: '978-1-23456-789-0',
      title: 'Modern Angular',
      author: 'Ada Developer',
      publisher: 'Blue Press',
      numPages: 320,
      price: '39.90',
      cover: 'https://example.test/angular.jpg',
      abstract: 'A practical guide.',
      userId: 1
    };

    client.getBookById('angular-20').subscribe(result => expect(result).toEqual(book));

    const request = httpTesting.expectOne('http://localhost:4730/books/angular-20');
    expect(request.request.method).toBe('GET');
    request.flush(book);
  });
});
