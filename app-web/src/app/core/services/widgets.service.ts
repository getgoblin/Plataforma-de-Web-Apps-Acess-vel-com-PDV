import { Injectable, signal, computed } from '@angular/core';

export type WidgetApp = { id: string; name: string; icon: string; category: string };

@Injectable({ providedIn: 'root' })
export class WidgetsService {
  // mock inicial — trocamos por fetch/HTTP depois
  private readonly _apps = signal<WidgetApp[]>([
    { id: 'pdv',    name: 'PDV',        icon: '🧾', category: 'Vendas' },
    { id: 'stock',  name: 'Estoque',    icon: '📦', category: 'Vendas' },
    { id: 'report', name: 'Relatórios', icon: '📊', category: 'Gestão' },
    { id: 'cfg',    name: 'Config',     icon: '⚙',  category: 'Sistema' },
  ]);

  apps = computed(() => this._apps());
  categories = computed(() => {
    const map = new Map<string, WidgetApp[]>();
    for (const a of this._apps()) {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    }
    return Array.from(map.entries()); // [ [categoria, apps[]], ... ]
  });
}
