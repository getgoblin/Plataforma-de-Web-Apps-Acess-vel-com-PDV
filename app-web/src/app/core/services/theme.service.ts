import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const LS_THEME_KEY = 'app:theme:mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>(this.readInitial());
  readonly mode = this._mode.asReadonly();
  readonly isLight = computed(() => this._mode() === 'light');

  constructor() {
    // apply at startup
    this.apply(this._mode());

    // persist + apply on changes
    effect(() => {
      const m = this._mode();
      this.write(m);
      this.apply(m);
    });

    // sync across tabs
    try {
      window.addEventListener('storage', (e) => {
        if (e.key === LS_THEME_KEY) {
          const v = this.readInitial(this._mode());
          if (v !== this._mode()) this._mode.set(v);
        }
      });
    } catch {}
  }

  toggle() {
    this._mode.update(m => (m === 'dark' ? 'light' : 'dark'));
  }

  set(mode: ThemeMode) {
    this._mode.set(mode);
  }

  private apply(mode: ThemeMode) {
    const root = document.documentElement;
    root.classList.toggle('theme-dark', mode === 'dark');
    root.classList.toggle('theme-light', mode === 'light');
  }

  private readInitial(fallback: ThemeMode = 'dark'): ThemeMode {
    try {
      const saved = localStorage.getItem(LS_THEME_KEY) as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    // if nothing saved, prefer current default (dark) and OS preference for first load
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    } catch {}
    return fallback;
  }

  private write(mode: ThemeMode) {
    try { localStorage.setItem(LS_THEME_KEY, mode); } catch {}
  }
}

