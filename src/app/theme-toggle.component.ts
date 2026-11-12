import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

type Theme = 'light' | 'dark';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      data-testid="theme-toggle"
      class="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 transition-colors duration-300 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 dark:text-gray-100 dark:hover:bg-gray-800"
      [attr.aria-pressed]="isDark()"
      aria-label="Toggle dark mode"
      [title]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      (click)="toggleTheme()"
    >
      {{ isDark() ? '☀️ Light mode' : '🌙 Dark mode' }}
    </button>
  `
})
export class ThemeToggleComponent {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'theme';
  readonly isDark = signal(this.readStoredTheme() === 'dark');

  constructor() {
    this.applyTheme(this.isDark());
  }

  toggleTheme(): void {
    const isDark = !this.isDark();
    this.isDark.set(isDark);
    this.applyTheme(isDark);
  }

  private applyTheme(isDark: boolean): void {
    this.document.body.classList.toggle('dark', isDark);
    this.storeTheme(isDark ? 'dark' : 'light');
  }

  private readStoredTheme(): Theme {
    try {
      return this.document.defaultView?.localStorage.getItem(this.storageKey) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private storeTheme(theme: Theme): void {
    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, theme);
    } catch {
      // A blocked or unavailable storage should not prevent theme switching.
    }
  }
}
