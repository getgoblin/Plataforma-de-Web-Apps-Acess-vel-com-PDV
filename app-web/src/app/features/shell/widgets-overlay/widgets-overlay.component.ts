import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, HostBinding, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService } from '../../../core/services/ui.service';
import { WidgetsService, type WidgetApp } from '../../../core/services/widgets.service';
import { WindowsService } from '../../../core/services/windows.service';
import { WidgetsButtonComponent } from '../../../shared/components/widgets-button/widgets-button.component';



@Component({
  selector: 'app-widgets-overlay',
  imports: [CommonModule, WidgetsButtonComponent],
  templateUrl: './widgets-overlay.component.html',
  styleUrl: './widgets-overlay.component.scss',
})
export class WidgetsOverlayComponent implements AfterViewInit, OnDestroy {
  private readonly ui = inject(UIService);
  private readonly widgets = inject(WidgetsService);
  private readonly windows = inject(WindowsService);

  // fase 1: sumir diálogo
private readonly fading = signal(false);
@HostBinding('class.is-fading') get _isFading(){ return this.fading(); }

// fase 2: fechar ripple
private readonly ripplingClose = signal(false);
@HostBinding('class.is-rippling-close') get _isRippling(){ return this.ripplingClose(); }


  categories = this.widgets.categories;

  @ViewChild('dlg', { static: true }) dlg?: ElementRef<HTMLDialogElement>;
  @ViewChild('fx',  { static: true }) fx?:  ElementRef<HTMLDivElement>; 
  @ViewChild('topbtn', { static: true }) topbtn?: ElementRef<HTMLDivElement>;

  readonly dialogOpen = signal(false);

  @HostBinding('class.is-closing') get closing() { return this.ui.widgetsClosing(); }



    ngAfterViewInit(): void {
      const cx = this.ui.widgetsCX() ?? window.innerWidth / 2;
      const cy = this.ui.widgetsCY() ?? 28;
      const r0 = this.ui.widgetsR()  ?? 18;

      const fxEl = this.fx?.nativeElement;
      if (fxEl) {
        fxEl.style.setProperty('--cx', `${cx}px`);
        fxEl.style.setProperty('--cy', `${cy}px`);
        fxEl.style.setProperty('--r0', `${r0}px`);
      }

        const br = this.ui.widgetsBtnRect();
      if (br && this.topbtn) {
        const el = this.topbtn.nativeElement;
        el.style.setProperty('--btn-x', `${br.x}px`);
        el.style.setProperty('--btn-y', `${br.y}px`);
        el.style.setProperty('--btn-w', `${br.w}px`);
        el.style.setProperty('--btn-h', `${br.h}px`);
      }

      const d = this.dlg?.nativeElement;
      if (d) {
        if (typeof d.showModal === 'function') d.showModal();
        else d.setAttribute('open', '');
      }

        effect(() => {
    if (this.ui.widgetsClosing()) {
      // começa a sumir o dialog
      this.fading.set(true);
    }
  });

  

      
      
    }

    

  ngOnDestroy(): void { try { this.dlg?.nativeElement.close(); } catch {} }

  close = () => { try { this.dlg?.nativeElement.close(); } catch {}; this.ui.toggleWidgets(); };

  onDarkWaveEnd(){
    if (!this.ui.widgetsClosing()){
      this.ui.setWidgetsFxDone(true);
      this.dialogOpen.set(true); // só aparece depois da 2ª onda abrir
    }
  }
  onGreenWaveEnd(){
    if (this.ui.widgetsClosing()){
      this.ui.confirmWidgetsClosed();
      this.fading.set(false);
      this.ripplingClose.set(false);
    }
  }

  onCancel(ev: Event) {
  ev.preventDefault();
  this.ui.requestWidgetsClose();
}

onDialogAnimEnd() {
  if (this.ui.widgetsClosing()) {
    this.dialogOpen.set(false);   // tira o [open] e o conteúdo
    this.ripplingClose.set(true); // ativa o colapso das ondas
  }
}

  

    openApp(app: WidgetApp) {
    this.windows.open(app); // abre na MainArea (futuramente o conteúdo real)
    this.close();           // fecha o overlay
  }

}
