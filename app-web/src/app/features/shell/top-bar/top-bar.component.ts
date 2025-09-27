import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { WindowManagerComponent } from './window-manager/window-manager.component';
import { UIService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-top-bar',
  imports: [WindowManagerComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})

export class TopBarComponent {

  private readonly userSvc = inject(UserService);
  userName = this.userSvc.userName; // signal<string>


  private readonly ui = inject(UIService);
  openWidgets = () => this.ui.toggleWidgets();
}