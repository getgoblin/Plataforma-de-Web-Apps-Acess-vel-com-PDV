import { Component, Input, ElementRef, inject, OnChanges, SimpleChanges, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowsService } from '../../../core/services/windows.service';
import { WinRect } from '../../../models/window';
import { WindowTopComponent } from '../../components/window-top/window-top.component';
import { GripDirective, GripDir } from './grip.directive';

@Component({
  selector: 'app-window-frame',
  standalone: true,
  imports: [CommonModule, WindowTopComponent, GripDirective],
  templateUrl: './window-frame.component.html',
  styleUrls: ['./window-frame.component.scss'],
})
export class WindowFrameComponent implements OnChanges, OnDestroy {
  private readonly wins = inject(WindowsService);
  constructor(private host: ElementRef<HTMLElement>) {}

  @Input({ required: true }) windowId!: string;
  @Input({ required: true }) title!: string;
  @Input() state: 'normal' | 'minimized' | 'maximized' = 'normal';
  @Input() zIndex: number = 0;

  get isMin()    { return this.state === 'minimized'; }
  get isMax()    { return this.state === 'maximized'; }
  get isNormal() { return this.state === 'normal'; }

  private readonly MIN_W = 320;
  private readonly MIN_H = 180;
  private readonly EDGE_SNAP = 16;

  private ro: ResizeObserver | null = null;
  private roScheduled = false;

  private dragMode:
    | 'move'
    | 'resize-e' | 'resize-w' | 'resize-n' | 'resize-s'
    | 'resize-ne'| 'resize-nw'| 'resize-se'| 'resize-sw'
    | 'pending-restore-move'
    | null = null;
  private startX = 0; private startY = 0;
  private startRect: WinRect | null = null;
  private readonly DRAG_RESTORE_THRESHOLD = 6;

  ngAfterViewInit() {
    if (this.isNormal) this.applyCurrentRectOrDefault();
    const slot = this.slotEl();
    if ('ResizeObserver' in window && slot) {
      this.ro = new ResizeObserver(() => this.onSlotResize());
      this.ro.observe(slot);
    }
  }
  private onSlotResize() {
    if (this.roScheduled) return;
    this.roScheduled = true;
    requestAnimationFrame(() => { this.roScheduled = false; this.fitRectIntoSlotBounds(); });
  }

  ngOnChanges(ch: SimpleChanges) {
    if ('state' in ch) { if (this.isNormal) this.applyCurrentRectOrDefault(); if (this.isMax) this.clearInlineRect(); }
  }
  ngOnDestroy(){ try { this.ro?.disconnect(); } catch {} this.ro = null; }

  // foca a janela ao clicar em qualquer área do frame
  @HostListener('mousedown', ['$event'])
  onFrameMouseDown(ev: MouseEvent) {
    this.wins.focus(this.windowId);
  }

  // === titlebar events vindos do window-top ===
  onTitlebarDown(e: MouseEvent) {
    // ao clicar na barra, traz a janela para frente
    this.wins.focus(this.windowId);
    // mesma lógica que você já tinha para pending-restore ou move
    if (this.isMax) {
      e.preventDefault();
      this.dragMode = 'pending-restore-move';
      this.startX = e.clientX; this.startY = e.clientY;
      window.addEventListener('mousemove', this.onMove);
      window.addEventListener('mouseup', this.onUp, { once: true });
      return;
    }
    if (!this.isNormal) return;
    e.preventDefault();
    const r = this.currentRect(); if (!r) return;
    this.dragMode = 'move'; this.startRect = { ...r };
    this.startX = e.clientX; this.startY = e.clientY;
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mouseup', this.onUp, { once: true });
  }

  // grips
  onGripDown({ dir, event }: { dir: GripDir; event: MouseEvent }) {
    if (!this.isNormal) return;
    event.preventDefault();
    const r = this.currentRect(); if (!r) return;
    this.dragMode = (('resize-' + dir) as typeof this.dragMode);
    this.startRect = { ...r };
    this.startX = event.clientX; this.startY = event.clientY;
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mouseup', this.onUp, { once: true });
  }

  // === botões (sem mudanças) ===
  minimize(){ /* ...igual ao seu (animação + wins.minimize) */ 
    const frame = this.q('.wframe');
    const bubble = document.querySelector(`.wm__bubble[data-win="${this.windowId}"]`) as HTMLElement | null;
    if (!frame || !bubble) { this.wins.minimize(this.windowId); return; }
    const fr = frame.getBoundingClientRect(), br = bubble.getBoundingClientRect();
    frame.style.setProperty('--minim-dx', `${(br.left + br.width/2) - fr.left}px`);
    frame.style.setProperty('--minim-dy', `${(br.top + br.height/2) - fr.top }px`);
    frame.classList.add('is-anim-minimizing');
    const onEnd = () => { frame.classList.remove('is-anim-minimizing'); frame.removeEventListener('animationend', onEnd); this.wins.minimize(this.windowId); };
    frame.addEventListener('animationend', onEnd);
  }
  maximize(){ this.wins.maximize(this.windowId); }
  restore(){ this.wins.restore(this.windowId); }
  close(){ this.wins.close(this.windowId); }
  // === move/resize (mousemove) ===
  private onMove = (e: MouseEvent) => {
    if (!this.dragMode) return;
    const slot = this.slotEl(); const W = slot.clientWidth; const H = slot.clientHeight;

    if (this.dragMode === 'pending-restore-move') {
      const dx = e.clientX - this.startX, dy = e.clientY - this.startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < this.DRAG_RESTORE_THRESHOLD) return;
      const saved = this.currentRect() ?? this.defaultCenteredRect(W, H, 0.6, 0.6);
      const w = Math.max(saved.w, this.MIN_W), h = Math.max(saved.h, this.MIN_H);
      const slotBox = slot.getBoundingClientRect();
      let x = Math.round(e.clientX - slotBox.left - w / 2);
      let y = Math.round(e.clientY - slotBox.top  - Math.round(this.titlebarH() / 2));
      x = clamp(x, 0, Math.max(0, W - w)); y = clamp(y, 0, Math.max(0, H - h));
      const rect: WinRect = { x, y, w, h };
      this.applyRect(rect); this.wins.setRect(this.windowId, rect); this.wins.restore(this.windowId);
      this.dragMode = 'move'; this.startRect = { ...rect }; this.startX = e.clientX; this.startY = e.clientY;
      return;
    }

    if (!this.startRect) return;
    const dx = e.clientX - this.startX, dy = e.clientY - this.startY;
    let { x, y, w, h } = this.startRect;

    if (this.dragMode === 'move') { x = clamp(x + dx, 0, Math.max(0, W - w)); y = clamp(y + dy, 0, Math.max(0, H - h)); }
    if (this.dragMode === 'resize-e' || this.dragMode === 'resize-se' || this.dragMode === 'resize-ne') w = clamp(w + dx, this.MIN_W, W - x);
    if (this.dragMode === 'resize-s' || this.dragMode === 'resize-se' || this.dragMode === 'resize-sw') h = clamp(h + dy, this.MIN_H, H - y);
    if (this.dragMode === 'resize-w' || this.dragMode === 'resize-nw' || this.dragMode === 'resize-sw') { const newX = clamp(x + dx, 0, x + w - this.MIN_W); w = w - (newX - x); x = newX; }
    if (this.dragMode === 'resize-n' || this.dragMode === 'resize-nw' || this.dragMode === 'resize-ne') { const newY = clamp(y + dy, 0, y + h - this.MIN_H); h = h - (newY - y); y = newY; }

    this.applyRect({ x, y, w, h });
  };

  // === end gesture ===
  private onUp = () => {
    window.removeEventListener('mousemove', this.onMove);
    if (!this.dragMode || !this.startRect) { this.dragMode = null; this.startRect = null; return; }

    const slot = this.slotEl(); const W = slot.clientWidth, H = slot.clientHeight;
    const r = this.readRectFromStyle();
    if (r) {
      const nearLeft = r.x <= this.EDGE_SNAP, nearRight = (r.x + r.w) >= (W - this.EDGE_SNAP);
      const nearTop  = r.y <= this.EDGE_SNAP, nearBot   = (r.y + r.h) >= (H - this.EDGE_SNAP);

      const isResize = typeof this.dragMode === 'string' && this.dragMode.startsWith('resize-');
      if (isResize) {
        const draggedE = this.dragMode.includes('e'), draggedW = this.dragMode.includes('w');
        const draggedN = this.dragMode.includes('n'), draggedS = this.dragMode.includes('s');
        // considerar snap somente quando houve expansão visível nesse eixo
        const expandedX = r.w >= (this.startRect!.w + 0.5);
        const expandedY = r.h >= (this.startRect!.h + 0.5);

        let nx = r.x, ny = r.y, nw = r.w, nh = r.h;

        // snap apenas da borda ARRASTADA (não maximiza e sim encosta no limite)
        if (draggedW && nearLeft && expandedX) {
          const right = r.x + r.w;
          nx = 0; nw = clamp(right - nx, this.MIN_W, W);
        }
        if (draggedE && nearRight && expandedX) {
          nx = r.x; nw = clamp(W - nx, this.MIN_W, W - nx);
        }
        if (draggedN && nearTop && expandedY) {
          const bottom = r.y + r.h;
          ny = 0; nh = clamp(bottom - ny, this.MIN_H, H);
        }
        if (draggedS && nearBot && expandedY) {
          ny = r.y; nh = clamp(H - ny, this.MIN_H, H - ny);
        }

        const snapped = (nx!==r.x)||(ny!==r.y)||(nw!==r.w)||(nh!==r.h);
        if (snapped) { const newR: WinRect = { x:nx, y:ny, w:nw, h:nh }; this.applyRect(newR); this.wins.setRect(this.windowId, newR); }
        else this.wins.setRect(this.windowId, r);
      } else {
        this.wins.setRect(this.windowId, r);
      }
    }
    this.dragMode = null; this.startRect = null;
  };

  // === rect helpers ===
  private currentRect(): WinRect | null { return this.wins.windows().find(x => x.id === this.windowId)?.rect ?? null; }
  private titlebarH(): number { return this.q('.wframe__titlebar')?.offsetHeight || 22; }
  private defaultCenteredRect(W:number,H:number,fx=0.5,fy=0.5): WinRect {
    const w = Math.max(Math.round(W*fx), this.MIN_W); const h = Math.max(Math.round(H*fy), this.MIN_H);
    const x = Math.round((W - w)/2); const y = Math.round((H - h)/2); return { x,y,w,h };
  }
  private applyCurrentRectOrDefault() {
    const slot = this.slotEl(); const saved = this.currentRect();
    if (saved) { this.applyRect(this.clampedToSlot(saved)); return; }
    const W=slot.clientWidth,H=slot.clientHeight; 
    // tamanho padrão um pouco menor que a área e com deslocamento por índice (efeito cascata)
    let rect = this.defaultCenteredRect(W,H,0.6,0.6);
    const idx = this.wins.windows().findIndex(w => w.id === this.windowId);
    const off = Math.max(0, Math.min(idx, 8)) * 24; // limita deslocamento a 8 passos
    rect = this.clampedToSlot({ x: rect.x + off, y: rect.y + off, w: rect.w, h: rect.h });
    this.applyRect(rect); this.wins.setRect(this.windowId, rect);
  }
  private fitRectIntoSlotBounds() {
    if (!this.isNormal) return;
    const r = this.readRectFromStyle(); if (!r) return;
    const c = this.clampedToSlot(r); if (c.x!==r.x||c.y!==r.y||c.w!==r.w||c.h!==r.h){ this.applyRect(c); this.wins.setRect(this.windowId, c); }
  }
  private clampedToSlot(r: WinRect): WinRect {
    const slot = this.slotEl(); const W=slot.clientWidth,H=slot.clientHeight;
    let w = clamp(r.w, this.MIN_W, W), h = clamp(r.h, this.MIN_H, H);
    let x = clamp(r.x, 0, Math.max(0, W - w)), y = clamp(r.y, 0, Math.max(0, H - h));
    x = clamp(x, 0, Math.max(0, W - w)); y = clamp(y, 0, Math.max(0, H - h));
    return { x,y,w,h };
  }
  private applyRect(r: WinRect) {
    const el = this.q('.wframe'); if (!el) return;
    el.style.left = `${r.x}px`; el.style.top = `${r.y}px`; el.style.width = `${r.w}px`; el.style.height = `${r.h}px`;
  }
  private clearInlineRect() {
    const el = this.q('.wframe'); if (!el) return;
    el.style.left = ''; el.style.top = ''; el.style.width = ''; el.style.height = '';
  }
  private readRectFromStyle(): WinRect | null {
    const el = this.q('.wframe'); if (!el) return null;
    const x = parseInt(el.style.left||'0',10), y = parseInt(el.style.top||'0',10);
    const w = parseInt(el.style.width||'0',10), h = parseInt(el.style.height||'0',10);
    return { x,y,w,h };
  }
  private q(sel: string){ return this.host.nativeElement.querySelector(sel) as HTMLElement | null; }
  private slotEl(){ return this.host.nativeElement.parentElement as HTMLElement; }
}

function clamp(v:number,a:number,b:number){ return Math.max(a, Math.min(b, v)); }
