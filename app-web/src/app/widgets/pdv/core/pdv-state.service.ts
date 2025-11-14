import { Injectable, computed, signal } from '@angular/core';
import { Cliente, DescontoTotal, FormaPgto, ItemCarrinho, Produto, clamp } from '../models/pdv.models';

function uid(prefix = 'ln'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

@Injectable({ providedIn: 'root' })
export class PdvStateService {
  // === estado base ===
  private readonly _cliente = signal<Cliente>({ nome: '', anonimo: false });
  private readonly _itens = signal<ItemCarrinho[]>([]);
  private readonly _descontoTotal = signal<DescontoTotal>({ tipo: 'percentual', valor: 0 });
  private readonly _formaPgto = signal<FormaPgto>('dinheiro');

  // === exposições ===
  readonly cliente = this._cliente.asReadonly();
  readonly itens = this._itens.asReadonly();
  readonly descontoTotal = this._descontoTotal.asReadonly();
  readonly formaPgto = this._formaPgto.asReadonly();

  // === computados ===
  readonly subtotal = computed(() => {
    return this._itens().reduce((acc, i) => acc + i.precoUnit * i.qtd, 0);
  });

  readonly totalDescontosUnitarios = computed(() => {
    return this._itens().reduce((acc, i) => acc + (i.precoUnit * i.qtd * (i.descontoPctUnit / 100)), 0);
  });

  readonly descontoTotalAplicado = computed(() => {
    const base = Math.max(0, this.subtotal() - this.totalDescontosUnitarios());
    const d = this._descontoTotal();
    if (d.tipo === 'valor') {
      return clamp(d.valor, 0, base);
    }
    // percentual
    const pct = clamp(d.valor, 0, 100);
    return base * (pct / 100);
  });

  readonly valorDescontado = computed(() => this.totalDescontosUnitarios() + this.descontoTotalAplicado());
  readonly totalAPagar = computed(() => Math.max(0, this.subtotal() - this.valorDescontado()));

  // === ações ===
  setCliente(p: Partial<Cliente>) {
    const cur = this._cliente();
    this._cliente.set({ ...cur, ...p, anonimo: !!(p.anonimo ?? cur.anonimo) });
  }

  toggleAnonimo() {
    const c = this._cliente();
    this._cliente.set({ ...c, anonimo: !c.anonimo });
  }

  clearCliente() {
    this._cliente.set({ nome: '', anonimo: false });
  }

  addProduto(p: Produto) {
    const exists = this._itens().find(i => i.produtoId === p.id);
    if (exists) {
      this.updateQtd(exists.idLinha, exists.qtd + 1);
      return;
    }
    const item: ItemCarrinho = {
      idLinha: uid(),
      produtoId: p.id,
      codigo: p.codigo,
      nome: p.nome,
      qtd: 1,
      precoUnit: p.precoUnit,
      descontoPctUnit: 0,
    };
    this._itens.update(arr => [item, ...arr]);
  }

  removeItem(idLinha: string) {
    this._itens.update(arr => arr.filter(i => i.idLinha !== idLinha));
  }

  updateQtd(idLinha: string, qtd: number) {
    const q = Math.max(1, Math.round(qtd));
    this._itens.update(arr => arr.map(i => i.idLinha === idLinha ? { ...i, qtd: q } : i));
  }

  updateDescUnit(idLinha: string, pct: number) {
    const p = clamp(pct, 0, 100);
    this._itens.update(arr => arr.map(i => i.idLinha === idLinha ? { ...i, descontoPctUnit: p } : i));
  }

  setDescontoTotal(d: DescontoTotal) { this._descontoTotal.set({ ...d }); }
  setFormaPgto(f: FormaPgto) { this._formaPgto.set(f); }

  limpar() {
    this._cliente.set({ nome: '', anonimo: false });
    this._itens.set([]);
    this._descontoTotal.set({ tipo: 'percentual', valor: 0 });
    this._formaPgto.set('dinheiro');
  }
}
