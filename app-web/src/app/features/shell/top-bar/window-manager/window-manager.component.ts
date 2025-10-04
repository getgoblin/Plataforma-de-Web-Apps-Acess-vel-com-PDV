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
  
  trackById = (_: number, w: { id: string }) => w.id;


  clickBubble(id: string) {
  const w = this.winSvc.windows().find(x => x.id === id);
  if (!w) return;
  if (w.state === 'minimized') this.winSvc.unminimize(id);
  else this.winSvc.focus(id);
}

    focus = (id: string) => {
      const w = this.wins().find(x => x.id === id);
      if (!w) return;
      if (w.state === 'minimized') this.winSvc.restore(id);
      this.winSvc.focus(id);
    };


  close  = (id: string) => this.winSvc.close(id);

  isActive(id: string): boolean {
    const f = this.focusedId();
    const w = this.wins().find(x => x.id === id);
    return !!w && w.state !== 'minimized' && f === id;
  }

  iconFor(appId: string): string {
    const meta = this.registry.getMeta(appId);
    return meta?.icon ?? '•';
  }

  
}
