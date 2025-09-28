import { Component, inject, signal, HostListener, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { UIService } from '../../../core/services/ui.service';
import { Router } from '@angular/router';
import { WindowManagerComponent } from './window-manager/window-manager.component';
import { WidgetsButtonComponent } from '../../../shared/components/widgets-button/widgets-button.component';
import { TabSlotsComponent } from '../../layout/tab-slots/tab-slots.component';
import { WindowsService } from '../../../core/services/windows.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, WindowManagerComponent, WidgetsButtonComponent, TabSlotsComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  private readonly userSvc = inject(UserService);
  private readonly router  = inject(Router);
  private readonly ui      = inject(UIService);
  private readonly wins    = inject(WindowsService);

  overlayOpen = this.ui.isOverlayMounted;
  userName = this.userSvc.userName;

  // dados para slots/abas
  winList = this.wins.windows;
  focusedId = this.wins.focusedId;
  occupiedCount = computed(() => Math.min(6, this.winList().length));
  focusedIndex = computed(() => this.winList().findIndex(w => w.id === this.focusedId()));

  // menu usuário
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
  @HostListener('document:keydown.escape') onEsc() { this.closeUserMenu(); }

  openHelp = () => window.open('assets/help/help.pdf', '_blank', 'noopener');
  onLogoff = () => { this.userSvc.logout(); this.router.navigate(['/login']); };
}
