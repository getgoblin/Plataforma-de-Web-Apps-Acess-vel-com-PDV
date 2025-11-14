import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
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

  @Input({ required: true }) item!: ItemCarrinho;

  remove(){ this.pdv.removeItem(this.item.idLinha); }
  updateQtd(v: string){ const n = Number(v); if (!isNaN(n)) this.pdv.updateQtd(this.item.idLinha, n); }
  updateDesc(v: string){ const n = Number(v); if (!isNaN(n)) this.pdv.updateDescUnit(this.item.idLinha, n); }

  // handlers para template (evitam casts no HTML)
  onQtyChange(ev: Event){ const v = (ev.target as HTMLInputElement | null)?.value ?? ''; this.updateQtd(v); }
  onDescChange(ev: Event){ const v = (ev.target as HTMLInputElement | null)?.value ?? ''; this.updateDesc(v); }
}
