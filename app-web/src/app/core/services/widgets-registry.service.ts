import { Injectable, Type, signal, computed } from '@angular/core';
import { WidgetMeta } from '../../models/widget';

type Entry = {
  /** carrega só o META (nome, ícone, categoria) */
  loadMeta: () => Promise<WidgetMeta>;
  /** carrega o componente standalone do widget */
  loadComponent: () => Promise<Type<any>>;
};

@Injectable({ providedIn: 'root' })
export class WidgetsRegistryService {
  /** 🔌 Registre cada widget aqui com imports LITERAIS */
  private readonly entries: Entry[] = [
    {
      // app-teste
      loadMeta: () =>
        import('../../widgets/app-teste/app-teste/app-teste.widget')
          .then(m => m.WIDGET_META as WidgetMeta),
      loadComponent: () =>
        import('../../widgets/app-teste/app-teste/app-teste.widget')
          .then(m => m.WIDGET_COMPONENT as Type<any>),
    },
    // { loadMeta: () => import('...').then(m => m.WIDGET_META), loadComponent: () => import('...').then(m => m.WIDGET_COMPONENT) },
  ];

  /** cache de metas e lookup de loaders por id */
  private readonly _metas = signal<WidgetMeta[]>([]);
  metas = computed(() => this._metas());
  private compLoaderById = new Map<string, () => Promise<Type<any>>>();

  constructor() { this.init(); }

  private async init() {
    const metas: WidgetMeta[] = [];
    for (const e of this.entries) {
      try {
        const meta = await e.loadMeta();
        if (!meta?.id) continue;
        metas.push(meta);
        this.compLoaderById.set(meta.id, e.loadComponent);
      } catch (err) {
        console.error('[WidgetsRegistry] Falha ao carregar meta:', err);
      }
    }
    this._metas.set(metas);
  }

  /** lista para o overlay */
  list(): WidgetMeta[] { return this.metas(); }

  /** meta por id (título/ícone/categoria) */
  getMeta(id: string): WidgetMeta | null {
    return this.metas().find(m => m.id === id) ?? null;
  }

  /** loader do componente por id */
  getLoader(id: string): (() => Promise<Type<any>>) | null {
    return this.compLoaderById.get(id) ?? null;
  }
}
