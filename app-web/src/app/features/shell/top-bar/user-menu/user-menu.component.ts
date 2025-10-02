import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService } from '../../../../core/services/ui.service';
import { UserService } from '../../../../core/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent {
  // deps
  private readonly ui = inject(UIService);
  private readonly userSvc = inject(UserService);
  private readonly router = inject(Router);

  // state
  open = signal(false);
  userName = this.userSvc.userName;
  leftHidden  = this.ui.leftHidden;
  rightHidden = this.ui.rightHidden;

  // refs
  @ViewChild('wrap') wrap?: ElementRef<HTMLElement>;

  // actions
  toggle = () => this.open.update(v => !v);
  close  = () => this.open.set(false);
  toggleHideLeft  = () => this.ui.toggleHideLeft();
  toggleHideRight = () => this.ui.toggleHideRight();
  openHelp = () => window.open('assets/help/help.pdf', '_blank', 'noopener');
  logoff   = () => { this.userSvc.logout(); this.router.navigate(['/login']); };

  // outside/esc
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const host = this.wrap?.nativeElement; if (!host) return;
    if (!host.contains(e.target as Node)) this.close();
  }
  @HostListener('document:keydown.escape') onEsc() { this.close(); }
}
