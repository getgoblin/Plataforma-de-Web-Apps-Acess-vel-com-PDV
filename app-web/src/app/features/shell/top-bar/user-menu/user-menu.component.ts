import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";

import { UserService } from "../../../../core/services/user.service";
import { UIService } from "../../../../core/services/ui.service";
import { ThemeService } from "../../../../core/services/theme.service";
import { HelperService } from "../../../../core/services/helper.service";
import { UserMenuIconButtonComponent } from "../../../../shared/components/user-menu-icon-buttons/user-menu-icon-buttons.component";

@Component({
  selector: "app-user-menu",
  standalone: true,
  imports: [CommonModule, UserMenuIconButtonComponent],
  templateUrl: "./user-menu.component.html",
  styleUrls: ["./user-menu.component.scss"],
})
export class UserMenuComponent {
  private readonly userSvc = inject(UserService);
  private readonly router = inject(Router);
  private readonly ui = inject(UIService);
  private readonly theme = inject(ThemeService);
  private readonly helper = inject(HelperService);

  // dropdown
  open = signal(false);
  @ViewChild("menuWrap") menuWrap?: ElementRef<HTMLElement>;
  toggleMenu() { this.open.update(v => !v); }
  closeMenu()  { this.open.set(false); }

  // usuário
  userName = this.userSvc.userName;

  // ocultar barras
  leftHidden  = this.ui.leftHidden;
  rightHidden = this.ui.rightHidden;
  toggleHideLeft  = () => this.ui.toggleHideLeft();
  toggleHideRight = () => this.ui.toggleHideRight();

  // Right só alterna quando a right bar está ativa
  canToggleRight = computed(() => this.ui.rightOpen());

  // helpers (estado visual local)
  hotkeysOn = signal(false);
  helperOn  = signal(false);
  visualOn  = signal(false);

  toggleHotkeys = () => this.hotkeysOn.update(v => !v);
  toggleHelper  = () => { this.helperOn.update(v => !v); this.helper.setEnabled(this.helperOn()); };
  toggleVisual  = () => this.visualOn.update(v => !v);

  // ações
  openHelp = () => window.open('assets/help/help.pdf', '_blank', 'noopener');
  onLogoff = () => { this.userSvc.logout(); this.router.navigate(["/login"]); };

  // tema
  isLight = this.theme.isLight;
  toggleTheme = () => this.theme.toggle();

  // fechar ao clicar fora / Esc
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const wrap = this.menuWrap?.nativeElement; if (!wrap) return;
    if (!wrap.contains(e.target as Node)) this.closeMenu();
  }
  @HostListener('document:keydown.escape') onEsc() { this.closeMenu(); }
}
