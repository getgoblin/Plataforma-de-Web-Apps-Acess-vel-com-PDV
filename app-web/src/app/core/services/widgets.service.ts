import { Injectable, computed, inject } from '@angular/core';
import { WidgetsRegistryService } from './widgets-registry.service';
import { WidgetMeta } from '../../models/widget';

@Injectable({ providedIn: 'root' })
export class WidgetsService {
  private readonly registry = inject(WidgetsRegistryService);
  apps = computed<WidgetMeta[]>(() => this.registry.list());
  categories = computed(() => {
    const map = new Map<string, WidgetMeta[]>();
    for (const a of this.apps()) {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    }
    return Array.from(map.entries());
  });
}
