// === deps/imports ===
import { Injectable, computed, inject } from '@angular/core';
import { WidgetsRegistryService } from './widgets-registry.service';
import { WidgetMeta } from '../../models/widget';

// === service ===
@Injectable({ providedIn: 'root' })
export class WidgetsService {
  // --- deps ---
  private readonly registry = inject(WidgetsRegistryService);

  // === selectors ===
  // --- lista plana de apps (metadados vindos do registry) ---
  readonly apps = computed<WidgetMeta[]>(() => this.registry.list());

  // --- categorias agrupadas e ordenadas ---
  // retorna tuplas: [categoria, WidgetMeta[]]
  readonly categories = computed(() => {
    // agrupa
    const map = new Map<string, WidgetMeta[]>();
    for (const meta of this.apps()) {
      const key = meta.category ?? 'Outros';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(meta);
    }
    // ordena apps por nome dentro de cada categoria
    for (const metas of map.values()) metas.sort((a, b) => a.name.localeCompare(b.name));
    // ordena categorias por nome
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  });

  // === helpers (opcionais) ===
  // --- procurar meta por id diretamente deste serviço ---
  getMeta(id: string): WidgetMeta | null {
    return this.apps().find(a => a.id === id) ?? null;
  }
}
