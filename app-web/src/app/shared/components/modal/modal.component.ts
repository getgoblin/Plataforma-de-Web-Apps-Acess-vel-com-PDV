import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() title = '';
  @Input() closeOnBackdrop = true;
  @Input() closeOnEsc = true;
  @Output() close = new EventEmitter<void>();

  @ViewChild('dialog') dialog!: ElementRef<HTMLElement>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      const o = !!this.open;
      try { document.body.classList.toggle('has-modal-open', o); } catch {}
      if (o) setTimeout(() => this.dialog?.nativeElement?.focus?.(), 0);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(ev: KeyboardEvent) {
    if (!this.open) return;
    if (this.closeOnEsc && ev.key === 'Escape') {
      ev.preventDefault();
      this.requestClose();
    }
  }

  onBackdropClick() {
    if (this.closeOnBackdrop) this.requestClose();
  }

  requestClose() { this.close.emit(); }

  ngOnDestroy(): void {
    try { document.body.classList.remove('has-modal-open'); } catch {}
  }
}
