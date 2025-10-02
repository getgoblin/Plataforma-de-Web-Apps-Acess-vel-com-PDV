import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
export type GripDir = 'e'|'w'|'n'|'s'|'ne'|'nw'|'se'|'sw';

@Directive({ selector: '[wGrip]', standalone: true })
export class GripDirective {
  @Input('wGrip') dir!: GripDir;
  @Output() gripDown = new EventEmitter<{ dir: GripDir; event: MouseEvent }>();
  @HostListener('mousedown', ['$event']) onDown(ev: MouseEvent){ this.gripDown.emit({ dir: this.dir, event: ev }); }
}
