import { Injectable, signal, computed, effect } from '@angular/core';

export type OverlayState =
  | 'idle'
  | 'expandingGreen'
  | 'expandingDark'
  | 'ready'
  | 'fading'
  | 'collapsingDark'
  | 'collapsingGreen';


const LS_UI = {
  left: 'app:ui:leftOpen',
  right: 'app:ui:rightOpen',
};

@Injectable({ providedIn: 'root' })
export class UIService {
  // barras
  private readonly _leftOpen    = signal(readBool(LS_UI.left,  false));
  private readonly _rightOpen   = signal(readBool(LS_UI.right, false));
  



  
  private readonly _widgetsBtnRect = signal<{ x:number; y:number; w:number; h:number } | null>(null);
  widgetsBtnRect = () => this._widgetsBtnRect();                     // getter (função)
  setWidgetsBtnRect(r: { x:number; y:number; w:number; h:number }) { // setter
    this._widgetsBtnRect.set(r);
  }

    // origem do ripple
  private readonly _cx = signal<number>(0);
  private readonly _cy = signal<number>(0);
  private readonly _r0 = signal<number>(18);

  widgetsCX = () => this._cx();
  widgetsCY = () => this._cy();
  widgetsR  = () => this._r0();

    // estado do overlay
  private readonly _overlayState = signal<OverlayState>('idle');
  overlayState = () => this._overlayState();

  // montar/desmontar overlay pelo estado
  isOverlayMounted = computed(() => this._overlayState() !== 'idle');

  // abrir overlay a partir do centro/raio do botão
  openAt(cx:number, cy:number, r0:number) {
    this._cx.set(Math.round(cx));
    this._cy.set(Math.round(cy));
    this._r0.set(Math.round(r0));
    this._overlayState.set('expandingGreen');
}

  // pedir fechamento (quando catálogo está visível)
  requestClose() {
    if (this._overlayState() === 'ready') this._overlayState.set('fading');
  }

  // transições dirigidas por animationend (chamadas pelo Overlay)
  toExpandingDark()   { if (this._overlayState() === 'expandingGreen') this._overlayState.set('expandingDark'); }
  toReady()           { if (this._overlayState() === 'expandingDark')  this._overlayState.set('ready'); }
  toCollapsingDark()  { if (this._overlayState() === 'fading')         this._overlayState.set('collapsingDark'); }
  toCollapsingGreen() { if (this._overlayState() === 'collapsingDark') this._overlayState.set('collapsingGreen'); }


  confirmClosed() {
    if (this._overlayState() === 'collapsingGreen') {
      this._overlayState.set('idle');
      this._widgetsBtnRect.set(null); // ✅ correto
    }
  }



  leftOpen  = computed(() => this._leftOpen());
  rightOpen = computed(() => this._rightOpen());

  
    constructor() {
    // persiste mudanças
    effect(() => writeBool(LS_UI.left,    this._leftOpen()));
    effect(() => writeBool(LS_UI.right,   this._rightOpen()));
  }

  toggleLeft()  { this._leftOpen.update(v => !v); }
  toggleRight() { this._rightOpen.update(v => !v); }

    // se precisar abrir/fechar diretamente:
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
    } catch {
      return fallback;
    }
  }
  function writeBool(key: string, val: boolean) {
    try { localStorage.setItem(key, val ? '1' : '0'); } catch {}
}


