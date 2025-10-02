// === deps ===
import { Component, Input, ElementRef, inject, HostListener, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
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
export class WindowFrameComponent implements OnChanges, OnDestroy {
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

  // === resize observer (encaixe quando sidebars mudam) ===
  private ro: ResizeObserver | null = null;

  // === gesture state ===
// === gesture state → modo atual e dados iniciais do gesto ===
  private dragMode:
    | 'move'
    | 'resize-e' | 'resize-w' | 'resize-n' | 'resize-s'
    | 'resize-ne'| 'resize-nw'| 'resize-se'| 'resize-sw'
    | 'pending-restore-move'           // 👈 novo estado
    | null = null;

  private startX = 0; private startY = 0;
  private startRect: WinRect | null = null;

  // quando maximizada: quantos px o cursor precisa mover para “destravar” o restore+move
  private readonly DRAG_RESTORE_THRESHOLD = 6;


  // === lifecycle ===
  ngAfterViewInit() {
    // aplica rect quando normal
    if (this.isNormal) this.applyCurrentRectOrDefault();

    // observa mudanças de tamanho da área útil (main-area) e ajusta a janela
    const slot = this.slotEl();
    if ('ResizeObserver' in window && slot) {
      this.ro = new ResizeObserver(() => this.fitRectIntoSlotBounds());
      this.ro.observe(slot);
    }
  }

  ngOnChanges(ch: SimpleChanges) {
    if ('state' in ch) {
      if (this.isNormal) this.applyCurrentRectOrDefault();
      if (this.isMax)    this.clearInlineRect();
    }
  }

  ngOnDestroy() {
    if (this.ro) { try { this.ro.disconnect(); } catch {} this.ro = null; }
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

  // === pointer handlers: onDown → decide modo e inicia arraste ===
@HostListener('mousedown', ['$event'])
onDown(e: MouseEvent) {
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

  // 🧲 MAX: clique simples na barra não restaura; mas prepara “arrastar-para-restaurar”
  if (this.isMax && bar) {
    e.preventDefault();
    this.dragMode = 'pending-restore-move';
    this.startX = e.clientX;
    this.startY = e.clientY;
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mouseup', this.onUp, { once: true });
    return;
  }

  // só permite arrastar/redimensionar em estado NORMAL
  if (!this.isNormal) return;

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
  this.startX = e.clientX;
  this.startY = e.clientY;
  window.addEventListener('mousemove', this.onMove);
  window.addEventListener('mouseup', this.onUp, { once: true });
}


  

  // === pointer handlers: onMove → calcula novo rect durante gesto ===
private onMove = (e: MouseEvent) => {
  if (!this.dragMode) return;

  const slot = this.slotEl();
  const W = slot.clientWidth;
  const H = slot.clientHeight;

  // 🔓 MAX → virou “arrastar-para-restaurar”?
  if (this.dragMode === 'pending-restore-move') {
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < this.DRAG_RESTORE_THRESHOLD) return;

    // usa rect salvo; se não houver, cria um default central
    const saved = this.currentRect() ?? this.defaultCenteredRect(W, H, 0.6, 0.6);

    // posiciona o retângulo restaurado com o cursor perto do meio da titlebar
    const w = Math.max(saved.w, this.MIN_W);
    const h = Math.max(saved.h, this.MIN_H);
    const slotBox = slot.getBoundingClientRect();
    let x = Math.round(e.clientX - slotBox.left - w / 2);
    let y = Math.round(e.clientY - slotBox.top  - 22); // ~meia titlebar
    x = clamp(x, 0, Math.max(0, W - w));
    y = clamp(y, 0, Math.max(0, H - h));

    const rect: WinRect = { x, y, w, h };
    this.applyRect(rect);
    this.wins.setRect(this.windowId, rect);
    this.wins.restore(this.windowId); // passa a NORMAL

    // continua agora como “move” a partir do ponto atual
    this.dragMode = 'move';
    this.startRect = { ...rect };
    this.startX = e.clientX;
    this.startY = e.clientY;
    return;
  }

  // ⬇️ estados “normal”: mover/redimensionar
  if (!this.startRect) return;

  const dx = e.clientX - this.startX;
  const dy = e.clientY - this.startY;
  let { x, y, w, h } = this.startRect;

  if (this.dragMode === 'move') {
    x = clamp(x + dx, 0, Math.max(0, W - w));
    y = clamp(y + dy, 0, Math.max(0, H - h));
  }
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


  // === pointer handlers: onUp → snap de REDIMENSIONAR só quando EXPANDE até a borda ===
  private onUp = () => {
    window.removeEventListener('mousemove', this.onMove);

    if (!this.dragMode || !this.startRect) {
      this.dragMode = null;
      this.startRect = null;
      return;
    }

    const slot = this.slotEl();
    const W = slot.clientWidth, H = slot.clientHeight;
    const r = this.readRectFromStyle();

    if (r) {
      // proximidade de bordas
      const nearLeft   = r.x <= this.EDGE_SNAP;
      const nearRight  = (r.x + r.w) >= (W - this.EDGE_SNAP);
      const nearTop    = r.y <= this.EDGE_SNAP;
      const nearBottom = (r.y + r.h) >= (H - this.EDGE_SNAP);

      // só consideramos snap quando foi gesto de RESIZE
      const isResize =
        this.dragMode.startsWith('resize-') ||
        this.dragMode === 'resize-e' || this.dragMode === 'resize-w' ||
        this.dragMode === 'resize-n' || this.dragMode === 'resize-s';

      if (isResize) {
        // qual borda foi arrastada?
        const draggedE = this.dragMode.includes('e');
        const draggedW = this.dragMode.includes('w');
        const draggedN = this.dragMode.includes('n');
        const draggedS = this.dragMode.includes('s');

        // só “expande” se terminou MAIOR (ou igual) ao início
        const expandedX = r.w >= (this.startRect!.w - 0.5);
        const expandedY = r.h >= (this.startRect!.h - 0.5);

        // hit conta SOMENTE se a borda ARRASTADA encostou na borda da área
        const hitX = (draggedE && nearRight) || (draggedW && nearLeft);
        const hitY = (draggedS && nearBottom) || (draggedN && nearTop);

        let nx = r.x, ny = r.y, nw = r.w, nh = r.h;

        // horizontal: expande para largura total APENAS se a borda arrastada encostou E houve expansão
        if (hitX && expandedX) { nx = 0; nw = W; }
        // vertical: expande para altura total APENAS se a borda arrastada encostou E houve expansão
        if (hitY && expandedY) { ny = 0; nh = H; }

        const snapped = (nx !== r.x) || (ny !== r.y) || (nw !== r.w) || (nh !== r.h);
        if (snapped) {
          const newR: WinRect = { x: nx, y: ny, w: nw, h: nh };
          this.applyRect(newR);
          this.wins.setRect(this.windowId, newR);
          this.wins.restore(this.windowId); // mantém estado NORMAL
        } else {
          // apenas persiste o tamanho/posição atual (sem snap)
          this.wins.setRect(this.windowId, r);
        }
      } else {
        // mover → sem snap automático
        this.wins.setRect(this.windowId, r);
      }
    }

    // reset
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

  private defaultCenteredRect(W: number, H: number, fx = 0.5, fy = 0.5): WinRect {
    const w = Math.max(Math.round(W * fx), this.MIN_W);
    const h = Math.max(Math.round(H * fy), this.MIN_H);
    const x = Math.round((W - w) / 2);
    const y = Math.round((H - h) / 2);
    return { x, y, w, h };
  }

  private applyCurrentRectOrDefault() {
    const slot = this.slotEl();
    const saved = this.currentRect();
    if (saved) { this.applyRect(this.clampedToSlot(saved)); return; }

    const W = slot.clientWidth, H = slot.clientHeight;
    const rect = this.defaultCenteredRect(W, H, 0.5, 0.5);
    this.applyRect(rect);
    this.wins.setRect(this.windowId, rect);
  }

  private fitRectIntoSlotBounds() {
    if (!this.isNormal) return; // max/min não precisam ajuste
    const r = this.readRectFromStyle();
    if (!r) return;
    const clamped = this.clampedToSlot(r);
    if (clamped.x !== r.x || clamped.y !== r.y || clamped.w !== r.w || clamped.h !== r.h) {
      this.applyRect(clamped);
      this.wins.setRect(this.windowId, clamped);
    }
  }

  private clampedToSlot(r: WinRect): WinRect {
    const slot = this.slotEl();
    const W = slot.clientWidth, H = slot.clientHeight;

    // tamanho não ultrapassa área
    let w = clamp(r.w, this.MIN_W, W);
    let h = clamp(r.h, this.MIN_H, H);

    // posição não sai da área
    let x = clamp(r.x, 0, Math.max(0, W - w));
    let y = clamp(r.y, 0, Math.max(0, H - h));

    // se tamanho foi reduzido por limites, re-clampa posição
    x = clamp(x, 0, Math.max(0, W - w));
    y = clamp(y, 0, Math.max(0, H - h));

    return { x, y, w, h };
  }

  private applyRect(r: WinRect) {
    const el = this.q('.wframe'); if (!el) return;
    el.style.left = `${r.x}px`;
    el.style.top  = `${r.y}px`;
    el.style.width = `${r.w}px`;
    el.style.height= `${r.h}px`;
  }
 
  private clearInlineRect() {
    const el = this.q('.wframe');
    if (!el) return;
    el.style.left = '';
    el.style.top = '';
    el.style.width = '';
    el.style.height = '';
  }

  private readRectFromStyle(): WinRect | null {
    const el = this.q('.wframe');
    if (!el) return null;
    const x = parseInt(el.style.left || '0', 10);
    const y = parseInt(el.style.top || '0', 10);
    const w = parseInt(el.style.width || '0', 10);
    const h = parseInt(el.style.height || '0', 10);
    return { x, y, w, h };
  }

  // === dom helpers ===
  private q(sel: string) {
    return this.host.nativeElement.querySelector(sel) as HTMLElement | null;
  }
  private slotEl() {
    return this.host.nativeElement.parentElement as HTMLElement; // .content-slot
  }
}

// === utils ===
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
