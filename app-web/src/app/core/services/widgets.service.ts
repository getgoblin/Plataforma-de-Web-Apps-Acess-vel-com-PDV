import { Injectable, signal, computed, inject } from '@angular/core';
import { WidgetApp } from '../../models/widget';
import { WidgetsRegistryService } from './widgets-registry.service';

@Injectable({ providedIn: 'root' })
export class WidgetsService {
  private readonly registry = inject(WidgetsRegistryService);

  // catálogo vem do registry
  private readonly _apps = signal<WidgetApp[]>(this.registry.list());

  readonly apps = computed(() => this._apps());
  readonly categories = computed(() => {
    const map = new Map<string, WidgetApp[]>();
    for (const a of this._apps()) {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    }
    return Array.from(map.entries());
  });
}
