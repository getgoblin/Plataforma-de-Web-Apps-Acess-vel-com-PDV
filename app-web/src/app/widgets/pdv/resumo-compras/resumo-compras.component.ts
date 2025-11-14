import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { PdvStateService } from '../core/pdv-state.service';
import { ItemLinhaComponent } from '../row-item/item-linha.component';

@Component({
  selector: 'pdv-resumo-compras',
  standalone: true,
  imports: [CommonModule, ItemLinhaComponent],
  templateUrl: './resumo-compras.component.html',
  styleUrls: ['./resumo-compras.component.scss']
})
export class ResumoComprasComponent {
  private readonly pdv = inject(PdvStateService);
  readonly itens = this.pdv.itens;
  readonly subtotal = this.pdv.subtotal;

  trackById = (_: number, item: any) => item.idLinha;
}
