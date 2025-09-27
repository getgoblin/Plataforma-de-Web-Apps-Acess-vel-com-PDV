import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { UIService } from '../../../core/services/ui.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widgets-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widgets-button.component.html',
  styleUrl: './widgets-button.component.scss'
})
export class WidgetsButtonComponent {
  private readonly ui = inject(UIService);

  @ViewChild('btn', { static: true }) btn!: ElementRef<HTMLButtonElement>;
  isFiring = signal(false);

  overlayOpen = this.ui.widgetsOverlayOpen;

onClick = (ev?: MouseEvent) => {
  ev?.stopPropagation();

  if (this.ui.widgetsOverlayOpen()) {   // overlay aberto? fecha
    this.ui.requestWidgetsClose();
    return;
  }

  const el = this.btn.nativeElement;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top  + r.height / 2;
  const radius = r.width / 2;

  this.ui.setWidgetsBtnRect({ x: r.left, y: r.top, w: r.width, h: r.height });
  this.isFiring.set(true);
  setTimeout(() => this.isFiring.set(false), 700);
  this.ui.openWidgetsAt(cx, cy, radius);
};

}
