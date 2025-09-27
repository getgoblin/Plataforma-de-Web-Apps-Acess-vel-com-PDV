import { Component, inject, computed } from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { LeftBarComponent } from '../left-bar/left-bar.component';
import { RightBarComponent } from '../right-bar/right-bar.component';
import { MainAreaComponent } from '../main-area/main-area.component';
import { WidgetsOverlayComponent } from '../widgets-overlay/widgets-overlay.component';
import { UIService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-shell-layout',
  imports: [
    TopBarComponent,
    LeftBarComponent,
    RightBarComponent,
    MainAreaComponent,
    WidgetsOverlayComponent
  ],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss'
})
export class ShellLayoutComponent {

private readonly ui = inject(UIService);
leftOpen  = this.ui.leftOpen;
rightOpen = this.ui.rightOpen;

// colunas reativas do grid
gridCols = computed(() => {
  const left  = this.leftOpen()  ? '300px' : '54px';
  const right = this.rightOpen() ? '300px' : '54px'; // <- handle visível
  return `${left} 1fr ${right}`;
});


}
