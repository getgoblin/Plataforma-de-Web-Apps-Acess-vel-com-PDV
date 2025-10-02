// === deps/imports ===
import { Injectable, signal, computed, effect } from '@angular/core';
import { AppWindow, WinRect, WinState } from '../../models/window';

// === consts/storage-keys ===
const LS_WINS  = 'app:windows';
const LS_FOCUS = 'app:windows:focus';

// === service ===
@Injectable({ providedIn: 'root' })
export class WindowsService {
  // --- signals (estado interno) ---
  private readonly _windows = signal<AppWindow[]>(WindowsService.readWins());
  private readonly _focused = signal<string | null>(WindowsService.readFocus());

  // --- selectors (públicos) ---
  readonly windows   = computed(() => this._windows());
  readonly focusedId = computed(() => this._focused());

  // === ctor: persistência + sync cross-tab ===
  constructor() {
    // persiste a lista de janelas
    effect(() => {
      try { localStorage.setItem(LS_WINS, JSON.stringify(this._windows())); } catch {}
    });
    // persiste o foco atual
    effect(() => {
      const f = this._focused();
      try { f ? localStorage.setItem(LS_FOCUS, f) : localStorage.removeItem(LS_FOCUS); } catch {}
    });
    // sincroniza entre abas
    try {
      window.addEventListener('storage', (e) => {
        if (e.key === LS_WINS)  this._windows.set(WindowsService.readWins());
        if (e.key === LS_FOCUS) this._focused.set(WindowsService.readFocus());
      });
    } catch {}
  }

  // === commands (API pública) ===
  // --- abrir (foca existente se já houver appId aberto) ---
  openByAppId(appId: string) {
    const existing = this._windows().find(w => w.appId === appId);
    if (existing) { this._focused.set(existing.id); return; }
    const id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
    const win: AppWindow = { id: `w-${id}`, title: appId, appId, state: 'maximized' };
    this._windows.update(ws => [...ws, win]);
    this._focused.set(win.id);
  }

  // --- foco/fechar ---
  focus(id: string) {
    if (this._windows().some(w => w.id === id)) this._focused.set(id);
  }
  close(id: string) {
    const next = this._windows().filter(w => w.id !== id);
    this._windows.set(next);
    if (this._focused() === id) this._focused.set(next.at(-1)?.id ?? null);
  }

  // --- posição/tamanho (estado NORMAL) ---
  /** inicializa/atualiza o rect do estado NORMAL (merge parcial) */
  setRect(id: string, rect: Partial<WinRect>) {
    this._windows.update(ws =>
      ws.map(w => w.id === id
        ? { ...w, rect: { ...(w.rect ?? { x:0, y:0, w:0, h:0 }), ...rect } }
        : w
      )
    );
  }

  // --- estados de janela ---
minimize(id: string) {
  this._windows.update(ws => ws.map(w => {
    if (w.id !== id) return w;
    // se já está minimizada, preserva prevState existente
    const prev = w.state === 'minimized' ? (w.prevState ?? 'normal') : (w.state as Exclude<WinState,'minimized'>);
    return { ...w, state: 'minimized', prevState: prev };
  }));
  this._focused.set(id);
}

unminimize(id: string) {
  this._windows.update(ws => ws.map(w => {
    if (w.id !== id) return w;
    const back = w.prevState ?? 'normal';
    const next = { ...w, state: back };
    delete (next as any).prevState;
    return next;
  }));
  this._focused.set(id);
}

// (opcional, só pra manter limpo: quando muda p/ max/normal, remove prevState)
maximize(id: string) {
  this._windows.update(ws => ws.map(w => w.id===id?({ ...w, state:'maximized', prevState: undefined }):w));
  this._focused.set(id);
}
restore(id: string) {
  this._windows.update(ws => ws.map(w => w.id===id?({ ...w, state:'normal', prevState: undefined }):w));
  this._focused.set(id);
}


  // === internals ===
  // --- troca de estado + mantém foco na janela alvo ---
  private patchState(id: string, state: WinState) {
    this._windows.update(ws => ws.map(w => w.id === id ? { ...w, state } : w));
    this._focused.set(id);
  }

  // --- leitura localStorage segura ---
  private static readWins(): AppWindow[] {
    try { return JSON.parse(localStorage.getItem(LS_WINS) || '[]') as AppWindow[]; }
    catch { return []; }
  }
  private static readFocus(): string | null {
    try { return localStorage.getItem(LS_FOCUS); }
    catch { return null; }
  }

  // === helpers (opcionais) ===
  getWindow(id: string): AppWindow | null {
    return this._windows().find(w => w.id === id) ?? null;
  }
  isFocused(id: string): boolean { return this._focused() === id; }
  isMinimized(id: string): boolean { return this.getWindow(id)?.state === 'minimized'; }
  isMaximized(id: string): boolean { return this.getWindow(id)?.state === 'maximized'; }
}
