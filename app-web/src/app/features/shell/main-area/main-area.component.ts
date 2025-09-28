import { Component, ElementRef, ViewChild, HostListener, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowsService } from '../../../core/services/windows.service';
import { WidgetsRegistryService } from '../../../core/services/widgets-registry.service';
import { WindowFrameComponent } from '../../../shared/components/window-frame/window-frame.component';

@Component({
  selector: 'app-main-area',
  standalone: true,
  imports: [CommonModule, WindowFrameComponent],
  templateUrl: './main-area.component.html',
  styleUrl: './main-area.component.scss'
})
export class MainAreaComponent {
  @ViewChild('ambient', { static: true }) ambient!: ElementRef<HTMLDivElement>;
  private readonly wins = inject(WindowsService);
  private readonly registry = inject(WidgetsRegistryService);

  focused = computed(() => {
    const id = this.wins.focusedId();
    return this.wins.windows().find(w => w.id === id) ?? null;
  });

  cmpFor = (appId: string) => this.registry.getComponent(appId);
  metaFor = (appId: string) => this.registry.getMeta?.(appId);

  @HostListener('pointermove', ['$event'])
  onPointerMove(e: PointerEvent) {
    const el = this.ambient.nativeElement, r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2, y = e.clientY - r.top - r.height/2;
    el.style.setProperty('--posX', String(Math.round(x)));
    el.style.setProperty('--posY', String(Math.round(y)));
  }
  @HostListener('pointerleave') onLeave() {
    const el = this.ambient.nativeElement;
    el.style.setProperty('--posX', '0'); el.style.setProperty('--posY', '0');
  }
}
