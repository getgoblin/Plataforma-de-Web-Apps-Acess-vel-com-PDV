import { Injectable, Type } from '@angular/core';
import { WidgetApp } from '../../models/widget';
import { AppTesteWidgetComponent } from '../../widgets/app-teste/app-teste/app-teste.widget';

export type WidgetDef = WidgetApp & { component: Type<any> };

@Injectable({ providedIn: 'root' })
export class WidgetsRegistryService {
  private readonly defs: WidgetDef[] = [
    { id: 'app-teste', name: 'App Teste', icon: '🧪', category: 'Demo', component: AppTesteWidgetComponent },
  ];

  list(): WidgetApp[] { return this.defs.map(({ component, ...app }) => app); }
  getComponent(appId: string): Type<any> | null {
    return this.defs.find(d => d.id === appId)?.component ?? null;
  }
  getMeta(appId: string): WidgetApp | null {
    const d = this.defs.find(x => x.id === appId);
    return d ? { id: d.id, name: d.name, icon: d.icon, category: d.category } : null;
  }
}
