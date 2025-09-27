import { Component, inject } from '@angular/core';
import { UIService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-left-bar',
  imports: [],
  templateUrl: './left-bar.component.html',
  styleUrl: './left-bar.component.scss'
})
export class LeftBarComponent {
  private readonly ui = inject(UIService);
  leftOpen = this.ui.leftOpen;
  toggleLeft = () => this.ui.toggleLeft();
}


