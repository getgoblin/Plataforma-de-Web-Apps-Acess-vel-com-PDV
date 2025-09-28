export type WindowState = 'normal' | 'minimized' | 'maximized';

export interface AppWindow {
  id: string;
  title: string;
  appId: string;
  /** estado da janela; default: 'normal' */
  state?: WindowState;
}
