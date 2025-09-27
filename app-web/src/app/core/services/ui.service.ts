import { Injectable, signal, computed, effect } from '@angular/core';


const LS_UI = {
  left: 'app:ui:leftOpen',
  right: 'app:ui:rightOpen',
  widgets: 'app:ui:widgetsOpen',
};

@Injectable({ providedIn: 'root' })
export class UIService {
  // barras
  private readonly _leftOpen    = signal(readBool(LS_UI.left,  false));
  private readonly _rightOpen   = signal(readBool(LS_UI.right, false));
  private readonly _widgetsOpen = signal(readBool(LS_UI.widgets, false));

  private readonly _widgetsFxDone   = signal(false); // ondas de abertura concluídas
  widgetsFxDone = computed(() => this._widgetsFxDone());

  private readonly _widgetsClosing  = signal(false); // estamos fechando com ripple inverso?
  widgetsClosing = computed(() => this._widgetsClosing());



// setter simples para marcar fim das ondas
setWidgetsFxDone(v: boolean) { this._widgetsFxDone.set(v); }

  requestWidgetsClose() {
  if (this._widgetsOpen()) this._widgetsClosing.set(true);
}

  confirmWidgetsClosed() {
  this._widgetsOpen.set(false);
  this._widgetsClosing.set(false);
  this._widgetsFxDone.set(false);
  this._widgetsBtnRect.set(null);
}


  
// posição/tamanho exatos do botão de widgets (para fixar no overlay)
  private readonly _widgetsBtnRect = signal<{ x:number; y:number; w:number; h:number } | null>(null);
  widgetsBtnRect = () => this._widgetsBtnRect();                     // getter (função)
  setWidgetsBtnRect(r: { x:number; y:number; w:number; h:number }) { // setter
    this._widgetsBtnRect.set(r);
  }


  //Centro Botão Widget para SCSS
  private readonly _widgetsCX = signal<number | null>(null);
  private readonly _widgetsCY = signal<number | null>(null);
  private readonly _widgetsR  = signal<number | null>(null);
  widgetsCX = computed(() => this._widgetsCX());
  widgetsCY = computed(() => this._widgetsCY());
  widgetsR  = computed(() => this._widgetsR());

  /** abre overlay informando o centro (cx, cy) e o raio (r) do botão */
openWidgetsAt(cx: number, cy: number, r: number) {
  this._widgetsCX.set(Math.round(cx));
  this._widgetsCY.set(Math.round(cy));
  this._widgetsR.set(Math.round(r));
  // reset do ciclo
  this._widgetsFxDone.set(false);
  this._widgetsClosing.set(false);
  this._widgetsOpen.set(true);
}

  leftOpen  = computed(() => this._leftOpen());
  rightOpen = computed(() => this._rightOpen());
  widgetsOverlayOpen = computed(() => this._widgetsOpen());

  
  

    constructor() {
    // persiste mudanças
    effect(() => writeBool(LS_UI.left,    this._leftOpen()));
    effect(() => writeBool(LS_UI.right,   this._rightOpen()));
    effect(() => writeBool(LS_UI.widgets, this._widgetsOpen()));
  }

  toggleLeft()  { this._leftOpen.update(v => !v); }
  toggleRight() { this._rightOpen.update(v => !v); }
  toggleWidgets() { this._widgetsOpen.update(v => !v); }

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


