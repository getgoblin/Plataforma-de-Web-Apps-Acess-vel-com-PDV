import { Injectable, signal, computed, effect } from '@angular/core';

const LS_UI = {
  left: 'app:ui:leftOpen',
  right: 'app:ui:rightOpen',
};

type BtnRect = { x: number; y: number; w: number; h: number };

@Injectable({ providedIn: 'root' })
export class UIService {
  // estados das barras
  private readonly _leftOpen  = signal(readBool(LS_UI.left, false));
  private readonly _rightOpen = signal(readBool(LS_UI.right, false));

  leftOpen  = computed(() => this._leftOpen());
  rightOpen = computed(() => this._rightOpen());

  // overlay: montado/visível
  private readonly _isOverlayMounted = signal(false);
  isOverlayMounted = computed(() => this._isOverlayMounted());

  // retângulo do botão (coordenadas absolutas)
  private readonly _btnRect = signal<BtnRect | null>(null);
  btnRect = computed(() => this._btnRect());

  // montar/desmontar overlay
  openOverlay()  { this._isOverlayMounted.set(true); }
  closeOverlay() { 
    this._isOverlayMounted.set(false); 
    // mantém _btnRect (continua válido até o próximo clique)
  }

  // salvar posição do botão (TopBar) no momento do clique
  setBtnRect(r: BtnRect) { this._btnRect.set(r); }

  constructor() {
    effect(() => writeBool(LS_UI.left,  this._leftOpen()));
    effect(() => writeBool(LS_UI.right, this._rightOpen()));
  }

  toggleLeft()  { this._leftOpen.update(v => !v); }
  toggleRight() { this._rightOpen.update(v => !v); }

  openLeft()  { this._leftOpen.set(true); }
  closeLeft() { this._leftOpen.set(false); }
  openRight() { this._rightOpen.set(true); }
  closeRight(){ this._rightOpen.set(false); }
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
