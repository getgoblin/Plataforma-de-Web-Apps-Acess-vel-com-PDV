import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-window-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './window-top.component.html',
  styleUrls: ['./window-top.component.scss'],
})
export class WindowTopComponent {
  @Input({ required: true }) title!: string;
  @Input() isMax = false;

  @Output() minimize = new EventEmitter<void>();
  @Output() maximize = new EventEmitter<void>();
  @Output() restore  = new EventEmitter<void>();
  @Output() close    = new EventEmitter<void>();
  @Output() dragIntent = new EventEmitter<MouseEvent>(); // mousedown na barra

  // passa o mousedown pra cima (drag/restore é tratado no window-frame)
  onBarMouseDown(ev: MouseEvent){ this.dragIntent.emit(ev); }

  // mantém o dblclick aqui mesmo (toggle max/restore)
  @HostListener('dblclick', ['$event'])
  onDbl(ev: MouseEvent){
    ev.preventDefault();
    (this.isMax ? this.restore : this.maximize).emit();
  }
}
