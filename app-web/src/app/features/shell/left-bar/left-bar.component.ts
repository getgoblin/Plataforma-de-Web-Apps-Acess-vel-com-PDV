import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService, RightTool } from '../../../core/services/ui.service';
import { LeftBarIconButtonsComponent } from '../../../shared/components/left-bar-icon-buttons/left-bar-icon-buttons.component';

@Component({
  selector: 'app-left-bar',
  standalone: true,
  imports: [CommonModule, LeftBarIconButtonsComponent],
  templateUrl: './left-bar.component.html',
  styleUrl: './left-bar.component.scss',
})
export class LeftBarComponent {
  private readonly ui = inject(UIService);

  activeTool = this.ui.rightPanelTool;
  isToolActive = (t: RightTool) => () => this.activeTool() === t;

  openLogger = () => this.ui.toggleRightTool('logger');
  openTodo   = () => this.ui.toggleRightTool('todo');
  openNotes  = () => this.ui.toggleRightTool('notes');
}
