import { Component } from '@angular/core';
import { WidgetMeta } from '../../../models/widget';
import { PdvLayoutComponent } from '../pdv-layout/pdv-layout.component';

@Component({
  selector: 'app-pdv-widget',
  standalone: true,
  imports: [PdvLayoutComponent],
  template: `
    <section style="height:100%; display:grid">
      <pdv-layout></pdv-layout>
    </section>
  `,
})
export class PdvWidgetComponent {}

export const WIDGET_META: WidgetMeta = {
  id: 'pdv',
  name: 'PDV',
  icon: '🧾',
  category: 'Vendas',
};

export const WIDGET_COMPONENT = PdvWidgetComponent;

