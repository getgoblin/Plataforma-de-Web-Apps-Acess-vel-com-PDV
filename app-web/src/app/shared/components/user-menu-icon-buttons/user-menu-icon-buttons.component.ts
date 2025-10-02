import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-menu-icon-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu-icon-buttons.component.html',
  styleUrls: ['./user-menu-icon-buttons.component.scss'],
})
export class UserMenuIconButtonComponent {
  @Input() icon: string = '';              // ex: "⌨" | "?" | "👁"
  @Input() active = false;                 // destaca quando ligado
  @Input() showLabel = true;               // opcional (default true)
  @Input() label: string = '';             // texto opcional (não usaremos agora)
  @Input() size = 36;                      // px (todos iguais)
  @Input() ariaLabel: string = '';         // acessibilidade

  @Output() pressed = new EventEmitter<void>();
  onClick() { this.pressed.emit(); }
}
