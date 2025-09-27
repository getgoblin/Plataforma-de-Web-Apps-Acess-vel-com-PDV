import { Injectable, signal, computed } from '@angular/core';
import type { WidgetApp } from './widgets.service';

type Win = { id: string; title: string; appId: string };

@Injectable({ providedIn: 'root' })
export class WindowsService {
  private readonly _windows = signal<Win[]>([]);
  private readonly _focused = signal<string | null>(null);

  windows = computed(() => this._windows());
  focusedId = computed(() => this._focused());

  open(app: WidgetApp) {
    const id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
    const win: Win = { id: `w-${id}`, title: app.name, appId: app.id };
    this._windows.update(ws => [...ws, win]);
    this._focused.set(win.id);
  }
}
