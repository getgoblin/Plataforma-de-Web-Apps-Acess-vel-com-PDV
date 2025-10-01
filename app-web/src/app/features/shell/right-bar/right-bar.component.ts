import { Component, inject } from '@angular/core';
import { LoggerComponent } from './logger/logger.component';
import { UIService } from '../../../core/services/ui.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-right-bar',
  standalone: true,
  imports: [LoggerComponent, CommonModule],
  templateUrl: './right-bar.component.html',
  styleUrl: './right-bar.component.scss'
})
export class RightBarComponent {
  // === deps ===
  private readonly ui = inject(UIService);

  // === selectors ===
  rightOpen = this.ui.rightOpen;

  // === actions ===
  toggleRight = () => this.ui.toggleRight();
}
