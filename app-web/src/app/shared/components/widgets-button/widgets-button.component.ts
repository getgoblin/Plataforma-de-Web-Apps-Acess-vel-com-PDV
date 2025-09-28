import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-widgets-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button #btn type="button" class="btn-circle widgets-btn" (click)="onClick()"
            aria-label="Abrir/fechar catálogo de apps">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="4"  cy="4"  r="2"/><circle cx="12" cy="4"  r="2"/><circle cx="20" cy="4"  r="2"/>
        <circle cx="4"  cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="12" r="2"/>
        <circle cx="4"  cy="20" r="2"/><circle cx="12" cy="20" r="2"/><circle cx="20" cy="20" r="2"/>
      </svg>
    </button>
  `,
  styleUrls: ['./widgets-button.component.scss'],
})
export class WidgetsButtonComponent {
  private readonly ui = inject(UIService);
  @ViewChild('btn', { static: true }) btn!: ElementRef<HTMLButtonElement>;

  onClick() {
    // se já está montado, fecha
    if (this.ui.isOverlayMounted()) {
      this.ui.closeOverlay();
      return;
    }
    // salva a posição atual do botão (na TopBar) e abre
    const r = this.btn.nativeElement.getBoundingClientRect();
    this.ui.setBtnRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    this.ui.openOverlay();
  }
}
