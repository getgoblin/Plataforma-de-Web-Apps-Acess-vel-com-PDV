import { Component, ElementRef, ViewChild, HostListener, inject, computed, signal, effect, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowsService } from '../../../core/services/windows.service';
import { WidgetsRegistryService } from '../../../core/services/widgets-registry.service';
import { WindowFrameComponent } from '../../../shared/components/window-frame/window-frame.component';
import { AppWindow } from '../../../models/window';
import { WidgetMeta } from '../../../models/widget';

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

  // ✅ TIPADO: evita "unknown" e "any"
  focused = computed<AppWindow | null>(() => {
    const id = this.wins.focusedId();
    return this.wins.windows().find((w: AppWindow) => w.id === id) ?? null;
  });

  cmp = signal<Type<any> | null>(null);
  meta = signal<WidgetMeta | null>(null);
  loading = signal(false);

  constructor() {
    // ✅ effect síncrono + IIFE assíncrona (evita Promise no effect)
    effect(() => {
      const w = this.focused();
      (async () => {
        if (!w) { this.cmp.set(null); this.meta.set(null); return; }

        this.loading.set(true);
        this.cmp.set(null);
        this.meta.set(this.registry.getMeta(w.appId));

        const loader = this.registry.getLoader(w.appId);
        if (!loader) { this.loading.set(false); return; }

        try {
          const Cmp = await loader();
          this.cmp.set(Cmp);
        } finally {
          this.loading.set(false);
        }
      })();
    });
  }

  /** Move o foco do BG conforme o ponteiro */
  @HostListener('pointermove', ['$event'])
  onPointerMove(e: PointerEvent) {
    const el = this.ambient.nativeElement;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top  - rect.height / 2;
    el.style.setProperty('--posX', String(Math.round(x)));
    el.style.setProperty('--posY', String(Math.round(y)));
  }

  /** Ao sair, suaviza voltando ao centro */
  @HostListener('pointerleave')
  onLeave() {
    const el = this.ambient.nativeElement;
    el.style.setProperty('--posX', '0');
    el.style.setProperty('--posY', '0');
  }
}
