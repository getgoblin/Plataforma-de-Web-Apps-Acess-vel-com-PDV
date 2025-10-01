import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService } from '../../../core/services/ui.service';
import { WidgetsService } from '../../../core/services/widgets.service';
import { WindowsService } from '../../../core/services/windows.service';
import { WidgetsButtonComponent } from '../../../shared/components/widgets-button/widgets-button.component';
import type { WidgetMeta } from '../../../models/widget';

@Component({
  selector: 'app-widgets-overlay',
  standalone: true,
  imports: [CommonModule, WidgetsButtonComponent],
  templateUrl: './widgets-overlay.component.html',
  styleUrls: ['./widgets-overlay.component.scss']
})
export class WidgetsOverlayComponent {
  // === deps ===
  private readonly ui = inject(UIService);
  private readonly widgets = inject(WidgetsService);
  private readonly windows = inject(WindowsService);

  // === selectors ===
  categories = this.widgets.categories;

  // === events ===
  noop(ev: Event) { ev.stopPropagation(); }

  openApp(app: WidgetMeta) {
    this.windows.openByAppId(app.id);
    this.ui.closeOverlay();
  }
}
