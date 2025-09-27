import { Component, inject } from '@angular/core';
import { LoggerComponent } from './logger/logger.component';
import { UIService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-right-bar',
  imports: [LoggerComponent],
  templateUrl: './right-bar.component.html',
  styleUrl: './right-bar.component.scss'
})
export class RightBarComponent {
  private readonly ui = inject(UIService);
  rightOpen = this.ui.rightOpen;
  toggleRight = () => this.ui.toggleRight();
}
