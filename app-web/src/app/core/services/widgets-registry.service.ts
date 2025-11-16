
import { Injectable, Type, signal, computed } from '@angular/core';
import { WidgetMeta } from '../../models/widget';


type Entry = {

  loadMeta: () => Promise<WidgetMeta>;
  loadComponent: () => Promise<Type<any>>;
};


@Injectable({ providedIn: 'root' })
export class WidgetsRegistryService {
  private readonly entries: Entry[] = [
    {
      loadMeta: () =>
        import('../../widgets/pdv/pdv/pdv.widget')
          .then(m => m.WIDGET_META as WidgetMeta),
      loadComponent: () =>
        import('../../widgets/pdv/pdv/pdv.widget')
          .then(m => m.WIDGET_COMPONENT as Type<any>),
    },
    {
      loadMeta: () =>
        import('../../widgets/app-teste/app-teste/app-teste.widget')
          .then(m => m.WIDGET_META as WidgetMeta),
      loadComponent: () =>
        import('../../widgets/app-teste/app-teste/app-teste.widget')
          .then(m => m.WIDGET_COMPONENT as Type<any>),
    },
  ];


  private readonly _metas = signal<WidgetMeta[]>([]);
  readonly metas = computed(() => this._metas());
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


  list(): WidgetMeta[] { return this.metas(); }

 
  getMeta(id: string): WidgetMeta | null {
    return this.metas().find(m => m.id === id) ?? null;
  }


  getLoader(id: string): (() => Promise<Type<any>>) | null {
    return this.compLoaderById.get(id) ?? null;
  }
}
