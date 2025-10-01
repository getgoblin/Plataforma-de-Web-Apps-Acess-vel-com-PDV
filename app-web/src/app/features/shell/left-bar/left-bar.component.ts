import { Component, inject, signal } from '@angular/core';
import { UIService } from '../../../core/services/ui.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-left-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './left-bar.component.html',
  styleUrl: './left-bar.component.scss'
})
export class LeftBarComponent {
  // === deps ===
  private readonly ui = inject(UIService);

  // === selectors ===
  leftOpen = this.ui.leftOpen;

  // === actions ===
  toggleLeft = () => this.ui.toggleLeft();

  // === local state (toggles) ===
  hotkeysOn = signal(false);
  helperOn  = signal(false);
  visualOn  = signal(false);

  // --- local actions ---
  toggleHotkeys = () => this.hotkeysOn.update(v => !v);
  toggleHelper  = () => this.helperOn.update(v => !v);
  toggleVisual  = () => this.visualOn.update(v => !v);
}
