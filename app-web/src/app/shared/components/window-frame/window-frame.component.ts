// === deps ===
import { Component, Input, ElementRef, inject, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowsService } from '../../../core/services/windows.service';
import { WinRect } from '../../../models/window';

@Component({
  selector: 'app-window-frame',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './window-frame.component.html',
  styleUrls: ['./window-frame.component.scss'],
})
export class WindowFrameComponent implements OnChanges {
  // === deps ===
  private readonly wins = inject(WindowsService);
  constructor(private host: ElementRef<HTMLElement>) {}

  // === inputs/state ===
  @Input({ required: true }) windowId!: string;
  @Input({ required: true }) title!: string;
  @Input() state: 'normal' | 'minimized' | 'maximized' = 'normal';

  // === derived flags ===
  get isMin()    { return this.state === 'minimized'; }
  get isMax()    { return this.state === 'maximized'; }
  get isNormal() { return this.state === 'normal'; }

  // === config ===
  private readonly MIN_W = 320;
  private readonly MIN_H = 180;
  private readonly EDGE_SNAP = 16;

  // === lifecycle ===
  ngAfterViewInit() {
    if (this.isNormal) this.applyCurrentRectOrDefault();
  }
  ngOnChanges(ch: SimpleChanges) {
    if ('state' in ch) {
      if (this.isNormal) this.applyCurrentRectOrDefault();
      if (this.isMax)    this.clearInlineRect();
    }
  }

  // === actions (titlebar buttons) ===
  minimize() {
    const frame = this.q('.wframe');
    const bubble = document.querySelector(`.wm__bubble[data-win="${this.windowId}"]`) as HTMLElement | null;
    if (!frame || !bubble) { this.wins.minimize(this.windowId); return; }

    const fr = frame.getBoundingClientRect();
    const br = bubble.getBoundingClientRect();

    frame.style.setProperty('--minim-dx', `${(br.left + br.width/2) - fr.left}px`);
    frame.style.setProperty('--minim-dy', `${(br.top  + br.height/2) - fr.top }px`);
    frame.classList.add('is-anim-minimizing');

    const onEnd = () => {
      frame.classList.remove('is-anim-minimizing');
      frame.removeEventListener('animationend', onEnd);
      this.wins.minimize(this.windowId);
    };
    frame.addEventListener('animationend', onEnd);
  }
  maximize() { this.wins.maximize(this.windowId); }
  restore()  { this.wins.restore(this.windowId); }
  close()    { this.wins.close(this.windowId); }

  // === drag/resize (normal only) ===
  private dragMode:
    | 'move'
    | 'resize-e' | 'resize-w' | 'resize-n' | 'resize-s'
    | 'resize-ne'| 'resize-nw'| 'resize-se'| 'resize-sw'
    | null = null;
  private startX = 0; private startY = 0;
  private startRect: WinRect | null = null;

  @HostListener('mousedown', ['$event'])
  onDown(e: MouseEvent) {
    if (!this.isNormal) return;

    const t = e.target as HTMLElement;
    const bar   = t.closest('.wframe__titlebar');
    const gripE = t.closest('.wframe__grip-e');
    const gripW = t.closest('.wframe__grip-w');
    const gripN = t.closest('.wframe__grip-n');
    const gripS = t.closest('.wframe__grip-s');
    const gripNE= t.closest('.wframe__grip-ne');
    const gripNW= t.closest('.wframe__grip-nw');
    const gripSE= t.closest('.wframe__grip-se');
    const gripSW= t.closest('.wframe__grip-sw');

    if (bar)         this.dragMode = 'move';
    else if (gripNE) this.dragMode = 'resize-ne';
    else if (gripNW) this.dragMode = 'resize-nw';
    else if (gripSE) this.dragMode = 'resize-se';
    else if (gripSW) this.dragMode = 'resize-sw';
    else if (gripE)  this.dragMode = 'resize-e';
    else if (gripW)  this.dragMode = 'resize-w';
    else if (gripN)  this.dragMode = 'resize-n';
    else if (gripS)  this.dragMode = 'resize-s';
    else return;

    e.preventDefault();
    const r = this.currentRect();
    if (!r) return;
    this.startRect = { ...r };
    this.startX = e.clientX; this.startY = e.clientY;

    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mouseup', this.onUp, { once: true });
  }

  private onMove = (e: MouseEvent) => {
    if (!this.dragMode || !this.startRect) return;

    const slot = this.slotEl();
    const W = slot.clientWidth;
    const H = slot.clientHeight;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    let { x, y, w, h } = this.startRect;

    // mover
    if (this.dragMode === 'move') {
      x = clamp(x + dx, 0, Math.max(0, W - w));
      y = clamp(y + dy, 0, Math.max(0, H - h));
    }

    // redimensionar laterais
    if (this.dragMode === 'resize-e' || this.dragMode === 'resize-se' || this.dragMode === 'resize-ne') {
      w = clamp(w + dx, this.MIN_W, W - x);
    }
    if (this.dragMode === 'resize-s' || this.dragMode === 'resize-se' || this.dragMode === 'resize-sw') {
      h = clamp(h + dy, this.MIN_H, H - y);
    }
    if (this.dragMode === 'resize-w' || this.dragMode === 'resize-nw' || this.dragMode === 'resize-sw') {
      const newX = clamp(x + dx, 0, x + w - this.MIN_W);
      w = w - (newX - x);
      x = newX;
    }
    if (this.dragMode === 'resize-n' || this.dragMode === 'resize-nw' || this.dragMode === 'resize-ne') {
      const newY = clamp(y + dy, 0, y + h - this.MIN_H);
      h = h - (newY - y);
      y = newY;
    }

    this.applyRect({ x, y, w, h });
  };

  private onUp = () => {
    window.removeEventListener('mousemove', this.onMove);

    if (this.dragMode && this.startRect) {
      const slot = this.slotEl();
      const W = slot.clientWidth, H = slot.clientHeight;
      const r = this.readRectFromStyle();

      if (r) {
        if (this.dragMode === 'move') {
          // snap lateral (meia-tela) — sem maximizar no topo
          const nearLeft  = r.x <= this.EDGE_SNAP;
          const nearRight = (r.x + r.w) >= (W - this.EDGE_SNAP);

          if (nearLeft) {
            const half = Math.round(W / 2);
            const newR: WinRect = { x: 0, y: 0, w: half, h: H };
            this.applyRect(newR); this.wins.setRect(this.windowId, newR);
            this.wins.restore(this.windowId);
          } else if (nearRight) {
            const half = Math.round(W / 2);
            const newR: WinRect = { x: W - half, y: 0, w: half, h: H };
            this.applyRect(newR); this.wins.setRect(this.windowId, newR);
            this.wins.restore(this.windowId);
          } else {
            this.wins.setRect(this.windowId, r);
          }
        } else {
          // resize → apenas persiste
          this.wins.setRect(this.windowId, r);
        }
      }
    }

    this.dragMode = null;
    this.startRect = null;
  };

  // === dblclick (titlebar): toggle max/restore ===
  @HostListener('dblclick', ['$event'])
  onDblClick(e: MouseEvent) {
    const bar = (e.target as HTMLElement).closest('.wframe__titlebar');
    if (!bar) return;
    e.preventDefault();
    this.isMax ? this.restore() : this.maximize();
  }

  // === helpers (rect) ===
  private currentRect(): WinRect | null {
    const w = this.wins.windows().find(x => x.id === this.windowId);
    return w?.rect ?? null;
  }
  private applyCurrentRectOrDefault() {
    const slot = this.slotEl();
    const saved = this.currentRect();
    if (saved) { this.applyRect(saved); return; }

    // default: central 50%
    const W = slot.clientWidth, H = slot.clientHeight;
    const w = Math.round(W * 0.5), h = Math.round(H * 0.5);
    const x = Math.round((W - w) / 2), y = Math.round((H - h) / 2);
    const rect: WinRect = { x, y, w, h };
    this.applyRect(rect);
    this.wins.setRect(this.windowId, rect);
  }
  private applyRect(r: WinRect) {
    const el = this.q('.wframe'); if (!el) return;
    el.style.left = `${r.x}px`;
    el.style.top  = `${r.y}px`;
    el.style.width = `${r.w}px`;
    el.style.height= `${r.h}px`;
  }
  private clearInlineRect() {
    const el = this.q('.wframe'); if (!el) return;
    el.style.left = ''; el.style.top = '';
    el.style.width = ''; el.style.height = '';
  }
  private readRectFromStyle(): WinRect | null {
    const el = this.q('.wframe'); if (!el) return null;
    const x = parseInt(el.style.left || '0', 10);
    const y = parseInt(el.style.top  || '0', 10);
    const w = parseInt(el.style.width || '0', 10);
    const h = parseInt(el.style.height|| '0', 10);
    return { x, y, w, h };
  }

  // === dom helpers ===
  private q(sel: string){ return this.host.nativeElement.querySelector(sel) as HTMLElement | null; }
  private slotEl(){ return (this.host.nativeElement.parentElement as HTMLElement); }
}

// === utils ===
function clamp(v: number, a: number, b: number){
  return Math.max(a, Math.min(b, v));
}
