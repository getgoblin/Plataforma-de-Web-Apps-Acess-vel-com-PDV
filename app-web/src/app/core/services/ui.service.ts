import { Injectable, signal, effect } from '@angular/core';

export type RightTool = 'logger' | 'todo' | 'notes';
type BtnRect = { x: number; y: number; w: number; h: number };

const LS_UI = {
  left:        'app:ui:leftOpen',
  right:       'app:ui:rightOpen',
  leftHidden:  'app:ui:leftHidden',
  rightHidden: 'app:ui:rightHidden',
  rightTool:   'app:ui:rightTool',
};

@Injectable({ providedIn: 'root' })
export class UIService {
  // largura (expandido/recolhido)
  private readonly _leftOpen  = signal(readBool(LS_UI.left, false));
  private readonly _rightOpen = signal(readBool(LS_UI.right, false));
  readonly leftOpen  = this._leftOpen.asReadonly();
  readonly rightOpen = this._rightOpen.asReadonly();

  // oculto (0px)
  private readonly _leftHidden  = signal(readBool(LS_UI.leftHidden, false));
  private readonly _rightHidden = signal(readBool(LS_UI.rightHidden, true)); // right começa oculta
  readonly leftHidden  = this._leftHidden.asReadonly();
  readonly rightHidden = this._rightHidden.asReadonly();

  // ferramenta ativa do painel direito
  private readonly _rightPanelTool = signal<RightTool | null>(readTool(LS_UI.rightTool));
  readonly rightPanelTool = this._rightPanelTool.asReadonly();

  // overlay widgets
  private readonly _isOverlayMounted = signal(false);
  readonly isOverlayMounted = this._isOverlayMounted.asReadonly();

  // posição de botão (se usada para overlay)
  private readonly _btnRect = signal<BtnRect | null>(null);
  readonly btnRect = this._btnRect.asReadonly();

  constructor() {
    // persistência
    effect(() => writeBool(LS_UI.left,        this._leftOpen()));
    effect(() => writeBool(LS_UI.right,       this._rightOpen()));
    effect(() => writeBool(LS_UI.leftHidden,  this._leftHidden()));
    effect(() => writeBool(LS_UI.rightHidden, this._rightHidden()));
    effect(() => writeTool(LS_UI.rightTool,   this._rightPanelTool()));

    // sync entre abas
    try {
      window.addEventListener('storage', (e) => {
        if (e.key === LS_UI.left)        this._leftOpen.set(readBool(LS_UI.left, this._leftOpen()));
        if (e.key === LS_UI.right)       this._rightOpen.set(readBool(LS_UI.right, this._rightOpen()));
        if (e.key === LS_UI.leftHidden)  this._leftHidden.set(readBool(LS_UI.leftHidden, this._leftHidden()));
        if (e.key === LS_UI.rightHidden) this._rightHidden.set(readBool(LS_UI.rightHidden, this._rightHidden()));
        if (e.key === LS_UI.rightTool)   this._rightPanelTool.set(readTool(LS_UI.rightTool, this._rightPanelTool()));
      });
    } catch {}
  }

  // overlay
  openOverlay()  { this._isOverlayMounted.set(true); }
  closeOverlay() { this._isOverlayMounted.set(false); }
  setBtnRect(r: BtnRect) { this._btnRect.set(r); }

  // abrir/fechar (largura)
  toggleLeft()  { this._leftOpen.update(v => !v); }
  toggleRight() { this._rightOpen.update(v => !v); }  // <- NÃO limpa tool
  openLeft()    { this._leftOpen.set(true); }
  closeLeft()   { this._leftOpen.set(false); }
  openRight()   { this._rightOpen.set(true); }
  closeRight()  { this._rightOpen.set(false); }       // <- NÃO limpa tool

  // ocultar/mostrar (0px)
  toggleHideLeft()  { this._leftHidden.update(v => !v); }
  toggleHideRight() { this._rightHidden.update(v => !v); }
  hideLeft()   { this._leftHidden.set(true); }
  showLeft()   { this._leftHidden.set(false); }
  hideRight()  { this._rightHidden.set(true); }
  showRight()  { this._rightHidden.set(false); }

  // right panel: selecionar/alternar ferramenta (para a Left-bar)
  openRightFor(tool: RightTool) {
    this._rightPanelTool.set(tool);
    this.showRight();
    this.openRight();
  }
  clearRight() {
    this._rightPanelTool.set(null);
    this.closeRight();
    this.hideRight();
  }
  toggleRightTool(tool: RightTool) {
    if (this._rightPanelTool() === tool) this.clearRight();
    else this.openRightFor(tool);
  }
}

/* helpers */
function readBool(key: string, fallback: boolean | (() => boolean)): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return typeof fallback === 'function' ? (fallback as any)() : fallback;
    return v === '1';
  } catch { return typeof fallback === 'function' ? (fallback as any)() : fallback; }
}
function writeBool(key: string, val: boolean) {
  try { localStorage.setItem(key, val ? '1' : '0'); } catch {}
}
function readTool(key: string, fallback?: RightTool | null | (() => RightTool | null)): RightTool | null {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return typeof fallback === 'function' ? (fallback as any)() : (fallback ?? null);
    if (v === 'logger' || v === 'todo' || v === 'notes') return v;
    return null;
  } catch { return typeof fallback === 'function' ? (fallback as any)() : (fallback ?? null); }
}
function writeTool(key: string, val: RightTool | null) {
  try {
    if (val == null) localStorage.removeItem(key);
    else localStorage.setItem(key, val);
  } catch {}
}
