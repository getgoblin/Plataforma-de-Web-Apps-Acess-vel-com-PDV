export type WinState = 'normal' | 'minimized' | 'maximized';

export interface WinRect { x: number; y: number; w: number; h: number; }

export interface AppWindow {
  id: string;
  title: string;
  appId: string;
  state: WinState;
  /** último tamanho/posição no estado NORMAL (p/ restaurar igual estava) */
  rect?: WinRect;
}
