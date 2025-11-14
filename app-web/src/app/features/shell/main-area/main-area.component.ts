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
  // === refs ===
  @ViewChild('ambient', { static: true }) ambient!: ElementRef<HTMLDivElement>;

  // === deps ===
  private readonly wins = inject(WindowsService);
  private readonly registry = inject(WidgetsRegistryService);

  // === selectors/state ===
  focused = computed<AppWindow | null>(() => {
    const id = this.wins.focusedId();
    return this.wins.windows().find((w: AppWindow) => w.id === id) ?? null;
  });

  cmp  = signal<Type<any> | null>(null);
  meta = signal<WidgetMeta | null>(null);
  loading = signal(false);

  // === multi-janela: lista visível, cache e z-index ===
  windows = this.wins.windows;
  focusedId = this.wins.focusedId;
  visible = computed<AppWindow[]>(() => this.windows().filter(w => w.state !== 'minimized'));

  private readonly metaMap = signal(new Map<string, WidgetMeta>());
  private readonly cmpMap  = signal(new Map<string, Type<any>>());

  metaFor(appId: string): WidgetMeta | null { return this.metaMap().get(appId) ?? null; }
  cmpFor(appId: string): Type<any> | null { return this.cmpMap().get(appId) ?? null; }
  trackById = (_: number, w: AppWindow) => w.id;

  zFor(id: string): number {
    const base = 100;
    const idx = this.windows().findIndex(w => w.id === id);
    const top = this.wins.focusedId() === id ? 1000 : 0;
    return base + idx + top;
  }

  // === bootstrap: carrega meta + componente do widget focado ===
constructor() {
  // carrega META + COMPONENT apenas quando o appId mudar
  const appId = computed(() => this.focused()?.appId ?? null);

  effect(() => {
    const id = appId();
    if (!id) { this.cmp.set(null); this.meta.set(null); this.loading.set(false); return; }

    this.loading.set(true);
    this.meta.set(this.registry.getMeta(id) ?? null);

    const loader = this.registry.getLoader(id);
    if (!loader) { this.cmp.set(null); this.loading.set(false); return; }

    (async () => {
      try {
        const Cmp = await loader();
        this.cmp.set(Cmp);             // ✅ mantém o mesmo Cmp enquanto só mexe no rect/estado
      } finally {
        this.loading.set(false);
      }
    })();
  });
  
  // carrega metas e componentes para TODAS as janelas visíveis
  effect(() => {
    const wins = this.visible();
    for (const w of wins) {
      const meta = this.registry.getMeta(w.appId);
      if (meta && !this.metaMap().has(w.appId)) {
        this.metaMap.update(m => { const n = new Map(m); n.set(w.appId, meta); return n; });
      }
      const loader = this.registry.getLoader(w.appId);
      if (loader && !this.cmpMap().has(w.appId)) {
        (async () => {
          try {
            const Cmp = await loader();
            this.cmpMap.update(m => { const n = new Map(m); n.set(w.appId, Cmp); return n; });
          } catch {}
        })();
      }
    }
  });
}


  // === ambient-bg pointer parallax ===
  @HostListener('pointermove', ['$event'])
  onPointerMove(e: PointerEvent) {
    const el = this.ambient.nativeElement;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top  - rect.height / 2;
    el.style.setProperty('--posX', String(Math.round(x)));
    el.style.setProperty('--posY', String(Math.round(y)));
  }

  @HostListener('pointerleave')
  onLeave() {
    const el = this.ambient.nativeElement;
    el.style.setProperty('--posX', '0');
    el.style.setProperty('--posY', '0');
  }
}
