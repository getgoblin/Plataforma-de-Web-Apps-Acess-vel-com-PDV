import { Component, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'app-left-bar-icon-buttons',
  standalone: true,
  templateUrl: './left-bar-icon-buttons.component.html',
  styleUrls: ['./left-bar-icon-buttons.component.scss']
})
export class LeftBarIconButtonsComponent {
  @Input() glyph = '•';
  @Input() label = '';
  @Input() active = false;

  @HostBinding('attr.role') role = 'listitem';
}
