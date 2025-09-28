import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowsService } from '../../../../core/services/windows.service';
import { WidgetsRegistryService } from '../../../../core/services/widgets-registry.service';

@Component({
  selector: 'app-window-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './window-manager.component.html',
  styleUrls: ['./window-manager.component.scss'],
})
export class WindowManagerComponent {
  private readonly winSvc = inject(WindowsService);
  private readonly registry = inject(WidgetsRegistryService);

  wins = this.winSvc.windows;
  focusedId = this.winSvc.focusedId;

  focus = (id: string) => this.winSvc.focus(id);
  close = (id: string) => this.winSvc.close(id);
  isFocused = (id: string) => this.focusedId() === id;

  iconFor(appId: string): string {
    const meta = this.registry.getMeta?.(appId);
    return meta?.icon ?? '•';
  }
}
