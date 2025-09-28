import { Component, inject, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { WindowManagerComponent } from './window-manager/window-manager.component';
import { UIService } from '../../../core/services/ui.service';
import { Router } from '@angular/router';
import { WidgetsButtonComponent } from '../../../shared/components/widgets-button/widgets-button.component';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, WindowManagerComponent, WidgetsButtonComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  private readonly userSvc = inject(UserService);
  private readonly router  = inject(Router);
  private readonly ui      = inject(UIService);

  // quando overlay abre, escondemos a TopBar inteira
  overlayOpen = this.ui.isOverlayMounted;

  userName = this.userSvc.userName;

  menuOpen = signal(false);
  @ViewChild('userMenuWrap') userMenuWrap?: ElementRef<HTMLElement>;

  toggleUserMenu() { this.menuOpen.update(v => !v); }
  closeUserMenu()  { this.menuOpen.set(false); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const wrap = this.userMenuWrap?.nativeElement;
    if (!wrap) return;
    if (!wrap.contains(e.target as Node)) this.closeUserMenu();
  }
  @HostListener('document:keydown.escape')
  onEsc() { this.closeUserMenu(); }

  openHelp = () => window.open('assets/help/help.pdf', '_blank', 'noopener');

  onLogoff = () => {
    this.userSvc.logout();
    this.router.navigate(['/login']);
  };
}
