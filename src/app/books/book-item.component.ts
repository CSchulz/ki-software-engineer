import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Book } from './book';

@Component({
  selector: 'app-book-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a
      [routerLink]="['/books', book.id]"
      class="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
      [attr.aria-label]="'View details for ' + book.title"
    >
      <article
        class="bg-white rounded-lg shadow-md overflow-hidden group-hover:shadow-xl transition-all duration-300 flex flex-col h-full group-hover:-translate-y-1"
      >
        <div class="relative aspect-[3/4] overflow-hidden">
          <img
            *ngIf="book.cover"
            [src]="book.cover"
            [alt]="'Cover of ' + book.title"
            class="w-full h-full object-contain bg-gray-100"
          />
          <div *ngIf="!book.cover" class="w-full h-full bg-gray-100 flex items-center justify-center">
            <span class="text-gray-500 text-sm font-medium">No cover available</span>
          </div>
        </div>
        <div class="p-5 flex flex-col flex-grow">
          <h2 class="text-lg font-semibold text-gray-800 mb-1 line-clamp-2 group-hover:text-blue-700">
            {{ book.title }}
          </h2>
          <p *ngIf="book.subtitle" class="text-sm text-gray-600 mb-2 line-clamp-2">{{ book.subtitle }}</p>
          <div class="text-sm text-gray-700 mt-auto">
            <p class="text-blue-700">{{ book.author }}</p>
            <p *ngIf="book.isbn" class="text-xs text-gray-500 mt-2">ISBN: {{ book.isbn }}</p>
          </div>
          <span class="mt-4 inline-flex items-center text-sm font-semibold text-blue-700" aria-hidden="true">
            View details
            <span class="ml-1 transition-transform group-hover:translate-x-1">→</span>
          </span>
        </div>
      </article>
    </a>
  `
})
export class BookItemComponent {
  @Input() book!: Book;
}
