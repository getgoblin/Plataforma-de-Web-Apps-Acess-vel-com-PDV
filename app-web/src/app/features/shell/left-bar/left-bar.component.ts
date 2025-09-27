import { Component, inject, signal } from '@angular/core';
import { UIService } from '../../../core/services/ui.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-left-bar',
  imports: [CommonModule],
  templateUrl: './left-bar.component.html',
  styleUrl: './left-bar.component.scss'
})
export class LeftBarComponent {
  private readonly ui = inject(UIService);

  leftOpen = this.ui.leftOpen;
  toggleLeft = () => this.ui.toggleLeft();
  
  // estados dos botões (simples por enquanto)
  hotkeysOn = signal(false);
  helperOn  = signal(false);
  visualOn  = signal(false);

  toggleHotkeys = () => this.hotkeysOn.update(v => !v);
  toggleHelper  = () => this.helperOn.update(v => !v);
  toggleVisual  = () => this.visualOn.update(v => !v);

}


