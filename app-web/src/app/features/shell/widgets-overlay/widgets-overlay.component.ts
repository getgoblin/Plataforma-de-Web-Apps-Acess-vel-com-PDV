import { AfterViewInit, Component, ElementRef, ViewChild, inject, effect } from '@angular/core';
import { UIService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-widgets-overlay',
  imports: [],
  templateUrl: './widgets-overlay.component.html',
  styleUrl: './widgets-overlay.component.scss'
})
export class WidgetsOverlayComponent implements AfterViewInit {
  private readonly ui = inject(UIService);

  @ViewChild('dlg') dlg?: ElementRef<HTMLDialogElement>;

  ngAfterViewInit(): void {
    // reaja ao estado e abre/fecha o <dialog>
    effect(() => {
      const open = this.ui.widgetsOverlayOpen();
      const d = this.dlg?.nativeElement;
      if (!d) return;
      if (open && !d.open) d.showModal();
      if (!open && d.open) d.close();
    });
  }

  close = () => this.ui.toggleWidgets();
}