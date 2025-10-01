// === deps/imports ===
import { Injectable, signal, computed, effect } from '@angular/core';

// === consts/keys ===
const LS_UI = {
  left: 'app:ui:leftOpen',
  right: 'app:ui:rightOpen',
};

// === types ===
type BtnRect = { x: number; y: number; w: number; h: number };

// === service ===
@Injectable({ providedIn: 'root' })
export class UIService {
  // --- signals (internos) ---
  private readonly _leftOpen  = signal(readBool(LS_UI.left,  false));
  private readonly _rightOpen = signal(readBool(LS_UI.right, false));
  private readonly _isOverlayMounted = signal(false);
  private readonly _btnRect = signal<BtnRect | null>(null);

  // --- signals (públicos readonly) ---
  readonly leftOpen  = this._leftOpen.asReadonly();
  readonly rightOpen = this._rightOpen.asReadonly();
  readonly isOverlayMounted = this._isOverlayMounted.asReadonly();
  readonly btnRect = this._btnRect.asReadonly();

  // --- ctor: persistência + sync cross-tab ---
  constructor() {
    // persiste estados
    effect(() => writeBool(LS_UI.left,  this._leftOpen()));
    effect(() => writeBool(LS_UI.right, this._rightOpen()));

    // sincroniza entre abas
    try {
      window.addEventListener('storage', (e) => {
        if (e.key === LS_UI.left)  this._leftOpen.set(readBool(LS_UI.left,  this._leftOpen()));
        if (e.key === LS_UI.right) this._rightOpen.set(readBool(LS_UI.right, this._rightOpen()));
      });
    } catch {}
  }

  // === overlay api ===
  openOverlay()  { this._isOverlayMounted.set(true); }
  closeOverlay() { this._isOverlayMounted.set(false); }
  setBtnRect(r: BtnRect) { this._btnRect.set(r); }

  // === left/right toggles ===
  toggleLeft()  { this._leftOpen.update(v => !v); }
  toggleRight() { this._rightOpen.update(v => !v); }

  openLeft()  { this._leftOpen.set(true); }
  closeLeft() { this._leftOpen.set(false); }
  openRight() { this._rightOpen.set(true); }
  closeRight(){ this._rightOpen.set(false); }
}

// === helpers (localStorage safe) ===
function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === '1';
  } catch { return fallback; }
}
function writeBool(key: string, val: boolean) {
  try { localStorage.setItem(key, val ? '1' : '0'); } catch {}
}
