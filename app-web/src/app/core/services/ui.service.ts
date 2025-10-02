import { Injectable, signal, computed, effect } from '@angular/core';

const LS_UI = {
  left: 'app:ui:leftOpen',
  right: 'app:ui:rightOpen',
  leftHidden: 'app:ui:leftHidden',
  rightHidden: 'app:ui:rightHidden',
};

type BtnRect = { x: number; y: number; w: number; h: number };

@Injectable({ providedIn: 'root' })
export class UIService {
  // barras abertas/fechadas
  private readonly _leftOpen  = signal(readBool(LS_UI.left, false));
  private readonly _rightOpen = signal(readBool(LS_UI.right, false));
  readonly leftOpen  = this._leftOpen.asReadonly();
  readonly rightOpen = this._rightOpen.asReadonly();

  // NOVO: barras ocultas (0px na grid)
  private readonly _leftHidden  = signal(readBool(LS_UI.leftHidden, false));
  private readonly _rightHidden = signal(readBool(LS_UI.rightHidden, false));
  readonly leftHidden  = this._leftHidden.asReadonly();
  readonly rightHidden = this._rightHidden.asReadonly();

  // overlay
  private readonly _isOverlayMounted = signal(false);
  readonly isOverlayMounted = this._isOverlayMounted.asReadonly();

  // btn rect (se você usa)
  private readonly _btnRect = signal<BtnRect | null>(null);
  readonly btnRect = this._btnRect.asReadonly();

  constructor() {
    // persistência
    effect(() => writeBool(LS_UI.left,        this._leftOpen()));
    effect(() => writeBool(LS_UI.right,       this._rightOpen()));
    effect(() => writeBool(LS_UI.leftHidden,  this._leftHidden()));
    effect(() => writeBool(LS_UI.rightHidden, this._rightHidden()));

    // sync entre abas
    try {
      window.addEventListener('storage', (e) => {
        if (e.key === LS_UI.left)        this._leftOpen.set(readBool(LS_UI.left, this._leftOpen()));
        if (e.key === LS_UI.right)       this._rightOpen.set(readBool(LS_UI.right, this._rightOpen()));
        if (e.key === LS_UI.leftHidden)  this._leftHidden.set(readBool(LS_UI.leftHidden, this._leftHidden()));
        if (e.key === LS_UI.rightHidden) this._rightHidden.set(readBool(LS_UI.rightHidden, this._rightHidden()));
      });
    } catch {}
  }

  // overlay
  openOverlay()  { this._isOverlayMounted.set(true); }
  closeOverlay() { this._isOverlayMounted.set(false); }
  setBtnRect(r: BtnRect) { this._btnRect.set(r); }

  // abrir/fechar (largura)
  toggleLeft()  { this._leftOpen.update(v => !v); }
  toggleRight() { this._rightOpen.update(v => !v); }
  openLeft()  { this._leftOpen.set(true); }
  closeLeft() { this._leftOpen.set(false); }
  openRight() { this._rightOpen.set(true); }
  closeRight(){ this._rightOpen.set(false); }

  // NOVO: ocultar/mostrar (0px)
  toggleHideLeft()  { this._leftHidden.update(v => !v); }
  toggleHideRight() { this._rightHidden.update(v => !v); }
  hideLeft()  { this._leftHidden.set(true); }
  showLeft()  { this._leftHidden.set(false); }
  hideRight() { this._rightHidden.set(true); }
  showRight(){ this._rightHidden.set(false); }
}

/* helpers */
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
