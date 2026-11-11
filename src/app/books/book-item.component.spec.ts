import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Book } from './book';
import { BookItemComponent } from './book-item.component';

@Component({ standalone: true, template: '<p>Book details</p>' })
class DetailTargetComponent {}

@Component({ standalone: true, template: '<p>Edit book</p>' })
class EditTargetComponent {}

describe('BookItemComponent', () => {
  let fixture: ComponentFixture<BookItemComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookItemComponent],
      providers: [
        provideRouter([
          { path: 'books/:id', component: DetailTargetComponent },
          { path: 'books/:id/edit', component: EditTargetComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookItemComponent);
    fixture.componentRef.setInput('book', {
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
    } satisfies Book);
    fixture.detectChanges();
    router = TestBed.inject(Router);
  });

  it('makes the complete card a keyboard-accessible link to the book details', async () => {
    const cardLink = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(cardLink).toBeTruthy();
    expect(cardLink.getAttribute('href')).toBe('/books/angular-20');
    expect(cardLink.textContent).toContain('Modern Angular');

    cardLink.click();
    await fixture.whenStable();

    expect(router.url).toBe('/books/angular-20');
  });

  it('AC: exposes an edit link from the book list to the shared edit route', () => {
    const editLink = fixture.nativeElement.querySelector(
      'a[href="/books/angular-20/edit"]'
    ) as HTMLAnchorElement | null;

    expect(editLink).withContext('an edit link should be rendered for the listed book').not.toBeNull();
    if (!editLink) return;

    expect(editLink?.textContent).withContext('the edit link should have an accessible name').toContain('Edit');
  });
});
