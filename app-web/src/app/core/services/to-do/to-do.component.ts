import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-todo-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel">
      <h3>To-do</h3>
      <p>(placeholder) Sua lista de tarefas aparecerá aqui.</p>
    </section>
  `,
  styles: [`
    .panel{ padding:12px; }
    h3{ margin:0 0 8px 0; font-size:14px; }
  `]
})
export class TodoPanelComponent {}
