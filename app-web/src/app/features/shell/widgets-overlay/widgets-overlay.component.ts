import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UIService } from "../../../core/services/ui.service";
import { WidgetsService } from "../../../core/services/widgets.service";
import { WindowsService } from "../../../core/services/windows.service";
import { WidgetsButtonComponent } from "../../../shared/components/widgets-button/widgets-button.component";
import type { WidgetMeta } from "../../../models/widget";

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
  trackById = (_: number, x: WidgetMeta) => x.id;

  noop(ev: Event) { ev.stopPropagation(); }
  close() { this.ui.closeOverlay(); }

  openApp(app: WidgetMeta) {
    const existing = this.windows.windows().find(w => w.appId === app.id);
    if (existing) {
      if (existing.state === 'minimized') this.windows.unminimize(existing.id);
      else this.windows.focus(existing.id);
    } else {
      this.windows.openByAppId(app.id);
    }
    this.ui.closeOverlay();
  }
}
