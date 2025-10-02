import { Injectable } from '@angular/core';

type HotkeyHandler = (ev: KeyboardEvent) => void;

function normKey(ev: KeyboardEvent) {
  const parts: string[] = [];
  if (ev.ctrlKey)  parts.push('ctrl');
  if (ev.metaKey)  parts.push('meta');
  if (ev.altKey)   parts.push('alt');
  if (ev.shiftKey) parts.push('shift');
  parts.push(ev.key.toLowerCase());
  return parts.join('+');
}

@Injectable({ providedIn: 'root' })
export class HotkeysService {
  private map = new Map<string, HotkeyHandler>();

  constructor() {
    window.addEventListener('keydown', (ev) => {
      const key = normKey(ev);
      const h = this.map.get(key);
      if (h) { ev.preventDefault(); h(ev); }
    });
  }

  /** Registra um atalho (ex: "ctrl+k"). */
  register(combo: string, handler: HotkeyHandler) {
    this.map.set(combo.toLowerCase(), handler);
    return () => this.unregister(combo);
  }

  /** Remove um atalho. */
  unregister(combo: string) {
    this.map.delete(combo.toLowerCase());
  }
}
