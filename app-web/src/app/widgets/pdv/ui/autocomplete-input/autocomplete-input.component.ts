import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, effect, inject, signal } from '@angular/core';

@Component({
  selector: 'pdv-autocomplete-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './autocomplete-input.component.html',
  styleUrls: ['./autocomplete-input.component.scss']
})
export class AutocompleteInputComponent implements OnInit {
  private host = inject(ElementRef<HTMLElement>);

  @Input() placeholder = '';
  @Input() ariaLabel = '';
  @Input() displayWith: (v: any) => string = (v) => String(v ?? '');
  @Input() search!: (query: string) => Promise<any[]>; // required
  @Input() value = '';
  @Input() openOnFocus = false;
  @Input() listAll?: () => Promise<any[]>;
  @Input() disabled = false;
  // Desliga sugestões do navegador (Chrome/Edge perfis)
  @Input() disableBrowserAutofill = true;
  @Input() keepOpenAfterSelect = false;
  @Input() clearOnSelect = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() itemSelected = new EventEmitter<any>();
  @Output() enterPressed = new EventEmitter<string>();

  @ViewChild('inputEl', { static: true }) inputEl!: ElementRef<HTMLInputElement>;

  readonly open = signal(false);
  private readonly _query = signal('');
  readonly options = signal<any[]>([]);
  private searchTimer: any = null;
  highlighted = signal<number>(-1);

  // anti-autofill
  afName = 'ac_' + Math.random().toString(36).slice(2);
  afId = 'ac_' + Math.random().toString(36).slice(2);
  readonlyHack = false;

  constructor(){
    effect(() => {
      const q = this._query();
      if (!this.search) return;
      clearTimeout(this.searchTimer);
      if (!q) {
        // Sem query: se já estiver aberto (por foco ou seleção), podemos manter com a lista completa
        if (this.listAll && this.open()) {
          this.searchTimer = setTimeout(async () => {
            const list = await this.listAll!();
            this.options.set(list || []);
            this.open.set((list?.length ?? 0) > 0);
            this.highlighted.set(list?.length ? 0 : -1);
          }, 150);
        } else {
          this.options.set([]);
          this.open.set(false);
        }
        return;
      }
      this.searchTimer = setTimeout(async () => {
        const list = await this.search(q);
        this.options.set(list || []);
        this.open.set((list?.length ?? 0) > 0);
        this.highlighted.set(list?.length ? 0 : -1);
      }, 250);
    });

    // fecha se desabilitar
    effect(() => {
      if (this.disabled) { this.open.set(false); this.options.set([]); }
    });
  }

  ngOnInit(): void {
    // ativa hack somente se solicitado
    this.readonlyHack = !!this.disableBrowserAutofill;
  }

  async onFocus(){
    if (this.disabled) return;
    // Remove readonly após focar para evitar sugestão automática do navegador
    if (this.readonlyHack) {
      setTimeout(() => {
        this.readonlyHack = false;
        try {
          const el = this.inputEl?.nativeElement;
          if (el) { const v = el.value ?? ''; el.setSelectionRange(v.length, v.length); }
        } catch {}
      }, 0);
    }
    if (this.openOnFocus && this.listAll) {
      try{
        const list = await this.listAll();
        this.options.set(list || []);
        this.open.set((list?.length ?? 0) > 0);
        this.highlighted.set(list?.length ? 0 : -1);
      } catch{}
    }
  }

  onInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    this.value = v;
    this.valueChange.emit(v);
    this._query.set(v);
  }

  onBlur() {
    // pequeno atraso para permitir clique no item
    setTimeout(() => this.open.set(false), 100);
  }

  pick(item: any) {
    const label = this.displayWith(item);
    if (this.clearOnSelect) {
      this.value = '';
      this.valueChange.emit('');
    } else {
      this.value = label;
      this.valueChange.emit(label);
    }
    this.itemSelected.emit(item);

    if (this.keepOpenAfterSelect) {
      if (this.listAll) {
        Promise.resolve(this.listAll()).then(list => {
          this.options.set(list || []);
          this.open.set((list?.length ?? 0) > 0);
          this.highlighted.set(list?.length ? 0 : -1);
        }).catch(() => {});
      } else {
        this.open.set(true);
      }
      queueMicrotask(() => this.inputEl?.nativeElement?.focus());
    } else {
      this.open.set(false);
    }
  }

  keydown(ev: KeyboardEvent) {
    const open = this.open();
    const opts = this.options();
    let idx = this.highlighted();
    if (ev.key === 'ArrowDown' && open) { idx = Math.min(opts.length - 1, idx + 1); this.highlighted.set(idx); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp' && open) { idx = Math.max(0, idx - 1); this.highlighted.set(idx); ev.preventDefault(); }
    else if (ev.key === 'Enter') {
      if (open && opts[idx]) this.pick(opts[idx]);
      else this.enterPressed.emit(this.value ?? '');
      ev.preventDefault();
    }
    else if (ev.key === 'Escape') { this.open.set(false); }
  }
}






