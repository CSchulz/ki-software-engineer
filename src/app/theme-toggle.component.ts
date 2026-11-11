import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Component, inject, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button
      type="button"
      class="rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 dark:text-gray-200 dark:hover:bg-gray-700"
      [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.aria-pressed]="isDark()"
      (click)="toggle()"
    >
      <span aria-hidden="true">{{ isDark() ? '☀' : '☾' }}</span>
    </button>
  `
})
export class ThemeToggleComponent {
  protected readonly isDark = signal(false);

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    const storedTheme = this.readStoredTheme();
    this.setTheme(storedTheme ?? 'light', false);
  }

  protected toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  private readStoredTheme(): Theme | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : null;
  }

  private setTheme(theme: Theme, persist = true): void {
    this.isDark.set(theme === 'dark');
    this.document.body.classList.toggle('dark', theme === 'dark');

    if (persist && isPlatformBrowser(this.platformId)) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }
}
