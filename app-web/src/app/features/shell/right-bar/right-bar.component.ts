import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService } from '../../../core/services/ui.service';
import { LoggerComponent } from './logger/logger.component';
import { TodoPanelComponent } from '../../../core/services/to-do/to-do.component';
import { NotesPanelComponent } from '../../../core/services/notes-panel/notes-panel.component';

@Component({
  selector: 'app-right-bar',
  standalone: true,
  imports: [CommonModule, LoggerComponent, TodoPanelComponent, NotesPanelComponent],
  templateUrl: './right-bar.component.html',
  styleUrl: './right-bar.component.scss'
})
export class RightBarComponent {
  private readonly ui = inject(UIService);

  rightOpen   = this.ui.rightOpen;
  rightHidden = this.ui.rightHidden;
  tool        = this.ui.rightPanelTool;

  title = computed(() => {
    switch (this.tool()) {
      case 'logger': return 'Logger';
      case 'todo':   return 'To-do';
      case 'notes':  return 'Notas';
      default:       return 'Painel';
    }
  });

  // Agora o toggle apenas recolhe/expande. Não limpa tool.
  toggleRight = () => {
    if (this.rightHidden()) return;         // se estiver oculta (0px), ignora o toggle
    if (this.rightOpen()) { this.ui.closeRight(); return; }
    if (this.tool())      { this.ui.openRight(); } // reabre no mesmo tool
    // se não há tool selecionada, não faz nada — a Left-bar é quem escolhe o tool
  };
}
