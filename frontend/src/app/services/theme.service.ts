import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'crypto-flow-theme';
  private readonly renderer: Renderer2;
  private readonly currentTheme$ = new BehaviorSubject<ThemeMode>(this.readInitialTheme());

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.applyTheme(this.currentTheme$.value);
  }

  themeChanges() {
    return this.currentTheme$.asObservable();
  }

  toggleTheme(): void {
    const next = this.currentTheme$.value === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme$.next(theme);
    localStorage.setItem(this.storageKey, theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeMode): void {
    const body = document.body;
    if (theme === 'dark') {
      this.renderer.addClass(body, 'dark-mode');
    } else {
      this.renderer.removeClass(body, 'dark-mode');
    }
  }

  private readInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'light';
    }
    const stored = localStorage.getItem(this.storageKey) as ThemeMode | null;
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
