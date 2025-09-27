import { Component, inject, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { WindowManagerComponent } from './window-manager/window-manager.component';
import { UIService } from '../../../core/services/ui.service';
import { Router } from '@angular/router';
import { WidgetsButtonComponent } from '../../../shared/components/widgets-button/widgets-button.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-top-bar',
  imports: [WindowManagerComponent, WidgetsButtonComponent, CommonModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})

export class TopBarComponent {

  private readonly userSvc = inject(UserService);
  private readonly router = inject(Router);
  private readonly ui = inject(UIService);

  overlayOpen = this.ui.widgetsOverlayOpen; //sinal para esconder se true

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

  @ViewChild('widgetsBtn') widgetsBtn?: ElementRef<HTMLButtonElement>;
  isFiring = signal(false);

openWidgetsAtBtnCenter() {
  // se já estiver aberto, só fecha
  // (ou, se quiser, mantenha o efeito — aqui vou só fechar)
  if (this.ui.widgetsOverlayOpen()) { this.ui.toggleWidgets(); return; }

  const el = this.widgetsBtn?.nativeElement;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top  + r.height / 2;
  const radius = r.width / 2;

  this.isFiring.set(true);
  setTimeout(() => this.isFiring.set(false), 700);
  this.ui.openWidgetsAt(cx, cy, radius);
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