import { Component, ElementRef, ViewChild, HostBinding, HostListener, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService } from '../../../core/services/ui.service';
import { WidgetsService, type WidgetApp } from '../../../core/services/widgets.service';
import { WindowsService } from '../../../core/services/windows.service';
import { WidgetsButtonComponent } from '../../../shared/components/widgets-button/widgets-button.component';

@Component({
  selector: 'app-widgets-overlay',
  standalone: true,
  imports: [CommonModule, WidgetsButtonComponent],
  templateUrl: './widgets-overlay.component.html',
  styleUrl: './widgets-overlay.component.scss',
})
export class WidgetsOverlayComponent {
  private readonly ui = inject(UIService);
  private readonly widgets = inject(WidgetsService);
  private readonly windows = inject(WindowsService);

  state = this.ui.overlayState;           // 'idle' | ... | 'ready' | ...

  // classe no host = nome do estado (controla CSS de ondas)
  @HostBinding('class') hostClass = '';

  @ViewChild('fx',     { static: true }) fx?: ElementRef<HTMLDivElement>;
  @ViewChild('topbtn', { static: true }) topbtn?: ElementRef<HTMLDivElement>;

  categories = this.widgets.categories;

  constructor() {
    effect(() => {
      // 1) aplica classe do estado
      this.hostClass = this.state();

      // 2) atualiza variáveis do ripple
      const fxEl = this.fx?.nativeElement;
      if (fxEl) {
        fxEl.style.setProperty('--cx', `${this.ui.widgetsCX()}px`);
        fxEl.style.setProperty('--cy', `${this.ui.widgetsCY()}px`);
        fxEl.style.setProperty('--r0', `${this.ui.widgetsR()}px`);
      }

      // 3) posiciona o botão no mesmo lugar da TopBar
      const br = this.ui.widgetsBtnRect();
      const tb = this.topbtn?.nativeElement;
      if (br && tb) {
        tb.style.setProperty('--btn-x', `${br.x}px`);
        tb.style.setProperty('--btn-y', `${br.y}px`);
        tb.style.setProperty('--btn-w', `${br.w}px`);
        tb.style.setProperty('--btn-h', `${br.h}px`);
      }
    });
  }

  // ESC fecha (pede fechamento com ripple inverso)
  @HostListener('document:keydown.escape')
  onEsc() { this.close(); }

  close() { this.ui.requestClose(); }

  // eventos das ondas (abrir/fechar)
  onGreenAnimEnd() {
    const s = this.state();
    if (s === 'expandingGreen') this.ui.toExpandingDark();
    if (s === 'collapsingGreen') this.ui.confirmClosed();
  }

  onDarkAnimEnd() {
    const s = this.state();
    if (s === 'expandingDark')  this.ui.toReady();            // aqui o catálogo aparece
    if (s === 'collapsingDark') this.ui.toCollapsingGreen();
  }

  // fim do fade do catálogo -> começa colapso escuro
  onDialogFadeEnd(_: AnimationEvent) {
    if (this.state() === 'fading') this.ui.toCollapsingDark();
  }

  openApp(app: WidgetApp) {
    this.windows.open(app);
    this.close();
  }
}
