import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowsService } from '../../../core/services/windows.service';

@Component({
  selector: 'app-window-frame',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './window-frame.component.html',
  styleUrls: ['./window-frame.component.scss'],
})
export class WindowFrameComponent {
  private readonly wins = inject(WindowsService);

  @Input({ required: true }) windowId!: string;
  @Input({ required: true }) title!: string;
  @Input() icon: string = '•';
  @Input() state: 'normal' | 'minimized' | 'maximized' = 'normal';

  close()    { this.wins.close(this.windowId); }
  minimize() { (this.wins as any).minimize?.(this.windowId); }
  maximize() { (this.wins as any).maximize?.(this.windowId); }
  restore()  { (this.wins as any).restore?.(this.windowId); }

  get isMax() { return this.state === 'maximized'; }
}
