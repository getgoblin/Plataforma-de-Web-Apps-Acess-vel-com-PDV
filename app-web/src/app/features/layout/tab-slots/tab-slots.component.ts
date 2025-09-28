import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab-slots',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-slots.component.html',
  styleUrls: ['./tab-slots.component.scss'],
})
export class TabSlotsComponent {
  @Input() count = 6;           // total de slots
  @Input() occupied = 0;        // quantos ocupados (0..count)
  @Input() focusedIndex = -1;   // índice do slot focado (0-based), -1 se nenhum
}
