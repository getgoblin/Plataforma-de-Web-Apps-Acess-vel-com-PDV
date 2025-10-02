export type WinState = 'normal' | 'minimized' | 'maximized';

export type WinRect = { x:number; y:number; w:number; h:number; };

export type AppWindow = {
  id: string;
  title: string;
  appId: string;
  state: WinState;
  rect?: WinRect;
  prevState?: Exclude<WinState, 'minimized'>; // ← guarda 'normal' ou 'maximized'
};
