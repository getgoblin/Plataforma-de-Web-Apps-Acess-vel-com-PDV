import { Component } from '@angular/core';
import { WidgetMeta } from '../../../models/widget'; // caminho: widgets/app-teste/app-teste → ../../../models

@Component({
  selector: 'app-app-teste-widget',
  standalone: true,
  template: `
    <section style="padding:16px">
      <h1 style="margin:0 0 8px">Teste janela</h1>
      <p>Widget carregado dinamicamente.</p>
    </section>
  `,
})
export class AppTesteWidgetComponent {}

export const WIDGET_META: WidgetMeta = {
  id: 'app-teste',
  name: 'App Teste',
  icon: '🧪',
  category: 'Demo',
};

export const WIDGET_COMPONENT = AppTesteWidgetComponent;
