import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';

type DetailError = 'not-found' | 'api' | null;

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <a
        routerLink="/"
        class="mb-6 inline-flex items-center rounded-md px-2 py-1 font-medium text-blue-700 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      >
        <span aria-hidden="true" class="mr-2">←</span>
        Back to Books
      </a>

      <section *ngIf="loading" role="status" aria-live="polite" class="py-20 text-center">
        <div
          class="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-blue-700"
          aria-hidden="true"
        ></div>
        <h1 class="mt-5 text-xl font-semibold text-gray-800">Loading book details...</h1>
        <p class="mt-2 text-gray-600">Please wait while the book is retrieved.</p>
      </section>

      <section
        *ngIf="!loading && error === 'not-found'"
        role="alert"
        class="rounded-xl border border-blue-100 bg-blue-50 px-6 py-14 text-center"
      >
        <h1 class="text-2xl font-bold text-blue-900">Book not found</h1>
        <p class="mt-3 text-blue-800">The requested book does not exist or is no longer available.</p>
      </section>

      <section
        *ngIf="!loading && error === 'api'"
        role="alert"
        class="rounded-xl border border-red-200 bg-red-50 px-6 py-14 text-center"
      >
        <h1 class="text-2xl font-bold text-red-800">Unable to load book details</h1>
        <p class="mt-3 text-red-700">The service is currently unavailable. Please try again later.</p>
      </section>

      <article *ngIf="!loading && !error && book" class="overflow-hidden rounded-2xl bg-white shadow-xl">
        <div class="grid grid-cols-1 md:grid-cols-[minmax(16rem,2fr)_3fr]">
          <figure class="flex min-h-80 items-center justify-center bg-blue-50 p-6 sm:p-10">
            <img
              *ngIf="book.cover"
              [src]="book.cover"
              [alt]="'Cover of ' + book.title"
              class="max-h-[32rem] w-full max-w-sm rounded-md object-contain shadow-md"
            />
            <div
              *ngIf="!book.cover"
              role="img"
              [attr.aria-label]="'No cover available for ' + book.title"
              class="flex aspect-[3/4] w-full max-w-xs flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-white px-6 text-center text-blue-800"
            >
              <svg
                aria-hidden="true"
                class="mb-4 h-14 w-14 text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"
                />
              </svg>
              <span class="font-semibold">No cover available</span>
            </div>
          </figure>

          <div class="p-6 sm:p-10">
            <header class="border-b border-gray-200 pb-6">
              <p class="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">Book details</p>
              <h1 class="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">{{ book.title }}</h1>
              <p *ngIf="book.subtitle" class="mt-3 text-xl text-gray-600">{{ book.subtitle }}</p>
              <p class="mt-4 text-lg font-medium text-blue-700">by {{ book.author }}</p>
            </header>

            <dl class="grid grid-cols-1 gap-x-8 gap-y-5 border-b border-gray-200 py-7 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Publisher</dt>
                <dd class="mt-1 text-gray-900">{{ book.publisher }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">ISBN</dt>
                <dd class="mt-1 text-gray-900">{{ book.isbn }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Number of pages</dt>
                <dd class="mt-1 text-gray-900">{{ book.numPages }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Price</dt>
                <dd class="mt-1 text-lg font-semibold text-blue-700">{{ book.price }}</dd>
              </div>
            </dl>

            <section class="pt-7" aria-labelledby="abstract-heading">
              <h2 id="abstract-heading" class="text-xl font-semibold text-gray-900">Abstract</h2>
              <p class="mt-3 whitespace-pre-line leading-7 text-gray-700">
                {{ book.abstract || 'No abstract available.' }}
              </p>
            </section>
          </div>
        </div>
      </article>
    </div>
  `
})
export class BookDetailComponent implements OnInit {
  book: Book | null = null;
  loading = true;
  error: DetailError = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly bookApiClient: BookApiClient
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      this.error = 'not-found';
      return;
    }

    this.bookApiClient.getBookById(id).subscribe({
      next: book => {
        this.book = book || null;
        this.error = book ? null : 'not-found';
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.status === 404 ? 'not-found' : 'api';
        this.loading = false;
      }
    });
  }
}
