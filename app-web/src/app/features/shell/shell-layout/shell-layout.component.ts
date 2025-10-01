import { Component, inject, computed, HostListener, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { LeftBarComponent } from '../left-bar/left-bar.component';
import { RightBarComponent } from '../right-bar/right-bar.component';
import { MainAreaComponent } from '../main-area/main-area.component';
import { WidgetsOverlayComponent } from '../widgets-overlay/widgets-overlay.component';
import { UIService } from '../../../core/services/ui.service';

type DragSide = 'left' | 'right' | null;

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [CommonModule, TopBarComponent, LeftBarComponent, RightBarComponent, MainAreaComponent, WidgetsOverlayComponent],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss',
})
export class ShellLayoutComponent {
  private readonly ui = inject(UIService);

  overlayOpen = this.ui.isOverlayMounted;
  leftOpen  = this.ui.leftOpen;
  rightOpen = this.ui.rightOpen;

  private readonly MIN = 48;
  private readonly MAX = 300;
  private readonly CLOSED = 54; // largura visual quando fechado

  // larguras controladas pela Shell
  private readonly _leftW  = signal<number>(this.MAX);
  private readonly _rightW = signal<number>(this.MAX);

  // flags para "não esticar ao abrir" quando a abertura veio de drag
  private suppressNextOpenSnapLeft  = false;
  private suppressNextOpenSnapRight = false;

  constructor() {
    // Fechou -> vai para MIN; Abriu -> só vai para MAX se não vier de drag
    effect(() => {
      if (!this.leftOpen()) {
        this._leftW.set(this.MIN);
      } else if (!this.suppressNextOpenSnapLeft) {
        this._leftW.set(this.MAX); // abertura por botão => vai ao máximo
      }
      this.suppressNextOpenSnapLeft = false; // consome a flag
    });

    effect(() => {
      if (!this.rightOpen()) {
        this._rightW.set(this.MIN);
      } else if (!this.suppressNextOpenSnapRight) {
        this._rightW.set(this.MAX);
      }
      this.suppressNextOpenSnapRight = false;
    });
  }

  // grid: 3 colunas
  private readonly _dragging = signal<DragSide>(null);
  gridCols = computed(() => {
    const dragging = this._dragging();
    const l = dragging === 'left'  ? this._leftW()  : (this.leftOpen()  ? this._leftW()  : this.CLOSED);
    const r = dragging === 'right' ? this._rightW() : (this.rightOpen() ? this._rightW() : this.CLOSED);
    return `${l}px 1fr ${r}px`;
  });

  // drag
  startDrag(side: DragSide, ev: MouseEvent) {
    this._dragging.set(side);
    ev.preventDefault();
  }

  @HostListener('document:mouseup')
  onUp() {
    const side = this._dragging();
    this._dragging.set(null);
    if (!side) return;

    if (side === 'left') {
      const w = this._leftW();
      if (w <= this.MIN) {
        (this as any).ui.closeLeft?.();
      } else {
        // abertura via drag → NÃO snap para MAX
        this.suppressNextOpenSnapLeft = true;
        (this as any).ui.openLeft?.();
      }
    } else if (side === 'right') {
      const w = this._rightW();
      if (w <= this.MIN) {
        (this as any).ui.closeRight?.();
      } else {
        this.suppressNextOpenSnapRight = true;
        (this as any).ui.openRight?.();
      }
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMove(e: MouseEvent) {
    const side = this._dragging();
    if (!side) return;

    const body = (e.currentTarget as Document).querySelector('.shell__body') as HTMLElement | null;
    if (!body) return;
    const rect = body.getBoundingClientRect();

    if (side === 'left') {
      const px = e.clientX - rect.left;
      this._leftW.set(clamp(px, this.MIN, this.MAX));
    } else if (side === 'right') {
      const px = rect.right - e.clientX;
      this._rightW.set(clamp(px, this.MIN, this.MAX));
    }
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, Math.round(v)));
}
