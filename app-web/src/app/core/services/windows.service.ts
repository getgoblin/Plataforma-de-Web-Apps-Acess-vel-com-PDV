import { Injectable, signal, computed, effect } from '@angular/core';
import { AppWindow } from '../../models/window';

const LS_WINS  = 'app:windows';
const LS_FOCUS = 'app:windows:focus';

@Injectable({ providedIn: 'root' })
export class WindowsService {
  private readonly _windows = signal<AppWindow[]>(WindowsService.readWins());
  private readonly _focused = signal<string | null>(WindowsService.readFocus());

  readonly windows   = computed(() => this._windows());
  readonly focusedId = computed(() => this._focused());

  constructor() {
    effect(() => { try { localStorage.setItem(LS_WINS, JSON.stringify(this._windows())); } catch {} });
    effect(() => {
      const f = this._focused();
      try { f ? localStorage.setItem(LS_FOCUS, f) : localStorage.removeItem(LS_FOCUS); } catch {}
    });
    try {
      window.addEventListener('storage', (e) => {
        if (e.key === LS_WINS)  this._windows.set(WindowsService.readWins());
        if (e.key === LS_FOCUS) this._focused.set(WindowsService.readFocus());
      });
    } catch {}
  }

openByAppId(appId: string) {
  const existing = this._windows().find(w => w.appId === appId);
  if (existing) { this._focused.set(existing.id); return; }
  const id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const win: AppWindow = { id: `w-${id}`, title: appId, appId, state: 'normal' as const };
  this._windows.update(ws => [...ws, win]);
  this._focused.set(win.id);
}


  focus(id: string) { if (this._windows().some(w => w.id === id)) this._focused.set(id); }
  close(id: string) {
    const next = this._windows().filter(w => w.id !== id);
    this._windows.set(next);
    if (this._focused() === id) this._focused.set(next.at(-1)?.id ?? null);
  }

  private static readWins(): AppWindow[] {
    try { return JSON.parse(localStorage.getItem(LS_WINS) || '[]') as AppWindow[]; } catch { return []; }
  }
  private static readFocus(): string | null {
    try { return localStorage.getItem(LS_FOCUS); } catch { return null; }
  }
}
