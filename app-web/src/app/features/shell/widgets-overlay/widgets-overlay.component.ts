import { Component, inject } from '@angular/core';
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
  styleUrls: ['./widgets-overlay.component.scss']
})
export class WidgetsOverlayComponent {
  private readonly ui = inject(UIService);
  private readonly widgets = inject(WidgetsService);
  private readonly windows = inject(WindowsService);

  categories = this.widgets.categories;

  noop(ev: Event) { ev.stopPropagation(); } // evita fechar ao clicar no fundo

  openApp(app: WidgetApp) {
    this.windows.open(app);
    this.ui.closeOverlay(); // fecha overlay ao escolher app
  }
}
