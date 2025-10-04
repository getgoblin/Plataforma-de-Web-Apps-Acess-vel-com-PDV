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
  /** Texto do item */
  @Input() label: string = '';
  /** Estado do slider */
  @Input() on = false;
  /** Desabilita interação */
  @Input() disabled = false;
  /** Altura (px) do item/slider */
  @Input() size = 36;
  /** A11y: aria-label (se não quiser exibir label visual) */
  @Input() ariaLabel: string = '';

  /** Clique no botão (o pai alterna `on`) */
  @Output() pressed = new EventEmitter<void>();
  onClick() { if (!this.disabled) this.pressed.emit(); }

  get ariaPressed(): 'true' | 'false' { return this.on ? 'true' : 'false'; }
}
