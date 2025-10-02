import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService } from '../../../core/services/ui.service';
import { WindowsService } from '../../../core/services/windows.service';
import { WindowManagerComponent } from './window-manager/window-manager.component';
import { WidgetsButtonComponent } from '../../../shared/components/widgets-button/widgets-button.component';
import { TabSlotsComponent } from '../../layout/tab-slots/tab-slots.component';
import { UserMenuComponent } from './user-menu/user-menu.component';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, WindowManagerComponent, WidgetsButtonComponent, TabSlotsComponent, UserMenuComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  private readonly ui   = inject(UIService);
  private readonly wins = inject(WindowsService);

  overlayOpen = this.ui.isOverlayMounted;

  winList = this.wins.windows;
  focusedId = this.wins.focusedId;
  occupiedCount = computed(() => Math.min(6, this.winList().length));
  focusedIndex = computed(() => this.winList().findIndex(w => w.id === this.focusedId()));
}
