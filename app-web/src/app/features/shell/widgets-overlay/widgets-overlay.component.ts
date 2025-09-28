import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService } from '../../../core/services/ui.service';
import { WidgetsService } from '../../../core/services/widgets.service';
import { WindowsService } from '../../../core/services/windows.service';
import { WidgetsButtonComponent } from '../../../shared/components/widgets-button/widgets-button.component';
import type { WidgetApp } from '../../../models/widget';

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

  noop(ev: Event) { ev.stopPropagation(); }

  openApp(app: WidgetApp) {
    this.windows.openByAppId(app.id, app.name); // ✅ cria/foca a janela
    this.ui.closeOverlay();                      // fecha o overlay
  }
}
