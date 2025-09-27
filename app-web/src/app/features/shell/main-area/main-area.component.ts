import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';

@Component({
  selector: 'app-main-area',
  imports: [],
  templateUrl: './main-area.component.html',
  styleUrl: './main-area.component.scss'
})
export class MainAreaComponent {
  @ViewChild('ambient', { static: true }) ambient!: ElementRef<HTMLDivElement>;

  /** Move o foco do BG conforme o ponteiro */
  @HostListener('pointermove', ['$event'])
  onPointerMove(e: PointerEvent) {
    const el = this.ambient.nativeElement;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top  - rect.height / 2;
    el.style.setProperty('--posX', String(Math.round(x)));
    el.style.setProperty('--posY', String(Math.round(y)));
  }

  /** Ao sair, suaviza voltando ao centro */
  @HostListener('pointerleave')
  onLeave() {
    const el = this.ambient.nativeElement;
    el.style.setProperty('--posX', '0');
    el.style.setProperty('--posY', '0');
  }
}