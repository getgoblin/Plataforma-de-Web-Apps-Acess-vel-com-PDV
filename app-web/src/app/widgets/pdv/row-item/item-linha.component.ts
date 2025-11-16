import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { ItemCarrinho } from '../models/pdv.models';
import { PdvStateService } from '../core/pdv-state.service';

@Component({
  selector: 'pdv-item-linha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-linha.component.html',
  styleUrls: ['./item-linha.component.scss']
})
export class ItemLinhaComponent {
  readonly pdv = inject(PdvStateService);
  readonly tipoDesc = signal<'percentual' | 'valor'>('percentual');

  @Input({ required: true }) item!: ItemCarrinho;

  remove(){ this.pdv.removeItem(this.item.idLinha); }

  updateQtd(v: string){
    const n = Number(v);
    if (!isNaN(n)) this.pdv.updateQtd(this.item.idLinha, n);
  }

  updateDesc(v: string){
    const n = Number(v);
    if (isNaN(n)) return;

    const tipo = this.tipoDesc();
    if (tipo === 'percentual') {
      this.pdv.updateDescUnit(this.item.idLinha, n);
    } else {
      const bruto = this.item.precoUnit * this.item.qtd;
      if (bruto <= 0) {
        this.pdv.updateDescUnit(this.item.idLinha, 0);
        return;
      }
      const pct = (n / bruto) * 100;
      this.pdv.updateDescUnit(this.item.idLinha, pct);
    }
  }

  // handlers para template (evitam casts no HTML)
  onQtyChange(ev: Event){
    const v = (ev.target as HTMLInputElement | null)?.value ?? '';
    this.updateQtd(v);
  }

  onDescChange(ev: Event){
    const v = (ev.target as HTMLInputElement | null)?.value ?? '';
    this.updateDesc(v);
  }

  onTipoDescChange(ev: Event){
    const val = (ev.target as HTMLSelectElement | null)?.value;
    if (val === 'percentual' || val === 'valor') {
      this.tipoDesc.set(val);
    }
  }
}
