import { Component, inject, signal, ElementRef, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { UIService } from '../../../core/services/ui.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-left-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './left-bar.component.html',
  styleUrl: './left-bar.component.scss'
})
export class LeftBarComponent implements AfterViewInit, OnDestroy {
  private readonly ui = inject(UIService);
  private readonly host = inject(ElementRef<HTMLElement>);

  leftOpen = this.ui.leftOpen;
  toggleLeft = () => this.ui.toggleLeft();

  hotkeysOn = signal(false);
  helperOn  = signal(false);
  visualOn  = signal(false);
  toggleHotkeys = () => this.hotkeysOn.update(v => !v);
  toggleHelper  = () => this.helperOn.update(v => !v);
  toggleVisual  = () => this.visualOn.update(v => !v);

  // ---- mostrar rótulos só quando couber ----
  private ro: ResizeObserver | null = null;
  private roCol: ResizeObserver | null = null;
  private readonly LABEL_MIN_W = 140;           // largura mínima pra caber texto
  canShowText = signal(false);

  // pega os nós relevantes uma vez
  private get barEl(): HTMLElement | null {
    return this.host.nativeElement.querySelector('.leftbar') as HTMLElement | null;
  }
  private get colEl(): HTMLElement | null {
    return this.host.nativeElement.closest('.shell__left') as HTMLElement | null;
  }

  private measure = () => {
    // mede a largura real disponível da barra
    const el = this.barEl;
    if (!el) return;
    const w = el.getBoundingClientRect().width;
    this.canShowText.set(w >= this.LABEL_MIN_W);
  };

  ngAfterViewInit(): void {
    const bar = this.barEl;
    const col = this.colEl;

    // observa a barra
    if ('ResizeObserver' in window && bar) {
      this.ro = new ResizeObserver(this.measure);
      this.ro.observe(bar);
    }
    // observa a coluna do grid (é ela que muda quando você arrasta a lateral)
    if ('ResizeObserver' in window && col) {
      this.roCol = new ResizeObserver(this.measure);
      this.roCol.observe(col);
    }

    // mede na largada
    this.measure();

    // quando abrir/fechar, mede depois do layout estabilizar
    effect(() => {
      this.leftOpen(); // só pra reagir
      requestAnimationFrame(() => requestAnimationFrame(this.measure));
    });

    // fallback: resize da janela
    window.addEventListener('resize', this.measure);
  }

  ngOnDestroy(): void {
    try { this.ro?.disconnect(); } catch {}
    try { this.roCol?.disconnect(); } catch {}
    this.ro = this.roCol = null;
    window.removeEventListener('resize', this.measure);
  }
}
