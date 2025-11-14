import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AutocompleteInputComponent } from '../ui/autocomplete-input/autocomplete-input.component';
import { ProdutosService } from '../core/produtos.service';
import { PdvStateService } from '../core/pdv-state.service';
import { ResumoComprasComponent } from '../resumo-compras/resumo-compras.component';
import { Produto } from '../models/pdv.models';

@Component({
  selector: 'pdv-leftpdv',
  standalone: true,
  imports: [CommonModule, AutocompleteInputComponent, ResumoComprasComponent],
  templateUrl: './leftpdv.component.html',
  styleUrls: ['./leftpdv.component.scss']
})
export class LeftpdvComponent {
  private readonly produtos = inject(ProdutosService);
  private readonly pdv = inject(PdvStateService);

  query = signal('');

  search = (q: string) => this.produtos.search(q);
  listAll = () => this.produtos.listAll();
  display = (p: Produto) => {
    const preco = p.precoUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const label = `${p.nome} | ${p.codigo} | R$ ${preco}`;
    return label.replace(/\uFFFD/g, '').replace(/\s{2,}/g, ' ');
  };

  add(p: Produto){ this.pdv.addProduto(p); this.query.set(''); }

  async addByQuery(term: string){
    const t = term?.trim();
    if (!t) return;
    const p = await this.produtos.getByCodigoOrNome(t);
    if (p) { this.add(p); }
  }
}
