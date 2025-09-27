import { Component, inject, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { WindowManagerComponent } from './window-manager/window-manager.component';
import { UIService } from '../../../core/services/ui.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-top-bar',
  imports: [WindowManagerComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})

export class TopBarComponent {

  private readonly userSvc = inject(UserService);
  private readonly router = inject(Router);
  private readonly ui = inject(UIService);

  userName = this.userSvc.userName; // signal<string>

    // dropdown
  menuOpen = signal(false);
  @ViewChild('userMenuWrap') userMenuWrap?: ElementRef<HTMLElement>;

  
  toggleUserMenu() {
    this.menuOpen.update(v => !v);
  }
  closeUserMenu() {
    this.menuOpen.set(false);
  }

    @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const wrap = this.userMenuWrap?.nativeElement;
    if (!wrap) return;
    if (!wrap.contains(e.target as Node)) this.closeUserMenu();
  }
  @HostListener('document:keydown.escape')
  onEsc() { this.closeUserMenu(); }

   openHelp = () => {
    // abre o PDF em nova aba
    window.open('assets/help/help.pdf', '_blank', 'noopener');
  };

  onLogoff = () => {
    this.userSvc.logout();
    this.router.navigate(['/login']);
  };

  openWidgets = () => this.ui.toggleWidgets();
}