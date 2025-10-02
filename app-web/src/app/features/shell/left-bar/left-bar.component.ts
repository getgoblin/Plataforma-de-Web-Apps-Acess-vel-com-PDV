import { Component, inject, signal, ElementRef, AfterViewInit, OnDestroy, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService, RightTool } from '../../../core/services/ui.service';

@Component({
  selector: 'app-left-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './left-bar.component.html',
  styleUrl: './left-bar.component.scss',
})
export class LeftBarComponent implements AfterViewInit, OnDestroy {
  private readonly ui = inject(UIService);
  private readonly host = inject(ElementRef<HTMLElement>);

  leftOpen = this.ui.leftOpen;
  toggleLeft = () => this.ui.toggleLeft();

  activeTool = this.ui.rightPanelTool;
  isToolActive = (t: RightTool) => computed(() => this.activeTool() === t);

  openLogger = () => this.ui.toggleRightTool('logger');
  openTodo   = () => this.ui.toggleRightTool('todo');
  openNotes  = () => this.ui.toggleRightTool('notes');

  private ro: ResizeObserver | null = null;
  private roCol: ResizeObserver | null = null;
  private readonly LABEL_MIN_W = 140;
  canShowText = signal(false);

  private get barEl(): HTMLElement | null {
    return this.host.nativeElement.querySelector('.leftbar') as HTMLElement | null;
  }
  private get colEl(): HTMLElement | null {
    return this.host.nativeElement.closest('.shell__left') as HTMLElement | null;
  }
  private measure = () => {
    const el = this.barEl; if (!el) return;
    const w = el.getBoundingClientRect().width;
    this.canShowText.set(w >= this.LABEL_MIN_W);
  };

  ngAfterViewInit(): void {
    const bar = this.barEl;
    const col = this.colEl;

    if ('ResizeObserver' in window && bar) {
      this.ro = new ResizeObserver(this.measure);
      this.ro.observe(bar);
    }
    if ('ResizeObserver' in window && col) {
      this.roCol = new ResizeObserver(this.measure);
      this.roCol.observe(col);
    }

    this.measure();

    effect(() => {
      this.leftOpen();
      requestAnimationFrame(() => requestAnimationFrame(this.measure));
    });

    window.addEventListener('resize', this.measure);
  }

  ngOnDestroy(): void {
    try { this.ro?.disconnect(); } catch {}
    try { this.roCol?.disconnect(); } catch {}
    this.ro = this.roCol = null;
    window.removeEventListener('resize', this.measure);
  }
}
