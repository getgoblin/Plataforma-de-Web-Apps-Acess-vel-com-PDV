import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UIService {
  // barras
  private readonly _leftOpen  = signal(false);
  private readonly _rightOpen = signal(true); // deixe true pra já ver o logger
  // overlay de widgets
  private readonly _widgetsOpen = signal(false);

  leftOpen  = computed(() => this._leftOpen());
  rightOpen = computed(() => this._rightOpen());
  widgetsOverlayOpen = computed(() => this._widgetsOpen());

  toggleLeft()  { this._leftOpen.update(v => !v); }
  toggleRight() { this._rightOpen.update(v => !v); }
  toggleWidgets() { this._widgetsOpen.update(v => !v); }
}
