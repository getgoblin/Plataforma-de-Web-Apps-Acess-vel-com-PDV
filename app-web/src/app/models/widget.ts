import { Type } from '@angular/core';

export interface WidgetMeta {
  id: string;        // slug único (ex.: 'app-teste')
  name: string;      // nome exibido
  icon: string;      // emoji ou ícone
  category: string;  // categoria no overlay
}

/** Padrão que CADA widget deve exportar do seu módulo .widget.ts */
export interface WidgetModuleShape {
  WIDGET_META: WidgetMeta;
  WIDGET_COMPONENT: Type<any>; // aponta para o componente standalone do widget
}
