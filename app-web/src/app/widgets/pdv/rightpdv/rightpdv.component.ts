import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, effect } from '@angular/core';
import { PdvStateService } from '../core/pdv-state.service';
import { OrdemCompraService } from '../core/ordem-compra.service';
import { OrdersApiService } from '../../../core/api/orders-api.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'pdv-rightpdv',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './rightpdv.component.html',
  styleUrls: ['./rightpdv.component.scss']
})
export class RightpdvComponent {
  readonly pdv = inject(PdvStateService);
  private readonly oc = inject(OrdemCompraService);
  private readonly ordersApi = inject(OrdersApiService);

  tipoDesc = signal<'percentual' | 'valor'>(this.pdv.descontoTotal().tipo);
  valorDesc = signal(this.pdv.descontoTotal().valor);

  subtotal = this.pdv.subtotal;
  totalDescontosUnit = this.pdv.totalDescontosUnitarios;
  descontoTotalAplicado = this.pdv.descontoTotalAplicado;
  valorDescontado = this.pdv.valorDescontado;
  totalAPagar = this.pdv.totalAPagar;
  readonly maxDescValorBase = computed(() => Math.max(0, this.subtotal() - this.totalDescontosUnit()));

  // parcelas (somente para cartão)
  readonly parcelasSel = signal(1);
  readonly parcelasOpts = computed(() => {
    const total = this.totalAPagar();
    const minPer = 50; // valor mínimo por parcela (simulador)
    const maxByValue = Math.floor(total / minPer);
    const max = Math.max(1, Math.min(12, isFinite(maxByValue) ? maxByValue : 1));
    return Array.from({ length: max }, (_, i) => i + 1);
  });
  readonly valorParcela = computed(() => this.totalAPagar() / Math.max(1, this.parcelasSel()));

  constructor(){
    // garante que seleção de parcelas esteja dentro do range quando total muda
    effect(() => {
      const max = this.parcelasOpts().length || 1;
      const cur = this.parcelasSel();
      if (cur > max) this.parcelasSel.set(max);
      if (cur < 1) this.parcelasSel.set(1);
    });
  }


  setTipo(tipo: 'percentual' | 'valor'){ this.tipoDesc.set(tipo); this.applyDesc(); }
  setValor(v: string){ const n = Number(v); this.valorDesc.set(isNaN(n) ? 0 : n); this.applyDesc(); }
  private applyDesc(){ this.pdv.setDescontoTotal({ tipo: this.tipoDesc(), valor: this.valorDesc() }); }

  // handlers para templates (evitam casts no HTML)
  onTipoChange(ev: Event){
    const val = (ev.target as HTMLSelectElement | null)?.value;
    if (val === 'percentual' || val === 'valor') this.setTipo(val);
  }
  onValorInput(ev: Event){
    const v = (ev.target as HTMLInputElement | null)?.value ?? '0';
    this.setValor(v);
  }

  onParcelasChange(ev: Event){
    const v = parseInt((ev.target as HTMLSelectElement | null)?.value ?? '1', 10);
    if (!Number.isNaN(v)) this.parcelasSel.set(v);
  }

  setPgto(f: 'dinheiro'|'cartao'|'pix'){ this.pdv.setFormaPgto(f); }

  async confirmar(){
    try{
      const c = this.pdv.cliente();
      const payload: any = {
        payment_method: this.pdv.formaPgto(),
        installments: this.parcelasSel(),
        items: this.pdv.itens().map(i => ({ product_id: Number(i.produtoId), qty: i.qtd, unit_discount_pct: i.descontoPctUnit }))
      };
      payload.client = { name: c.nome, email: c.email, phone: c.telefone, document: c.documento, anonymous: c.anonimo };
      if (this.tipoDesc() === 'valor') payload.order_discount = { type: 'value', value: Math.round(this.valorDesc() * 100) };
      else if (this.tipoDesc() === 'percentual') payload.order_discount = { type: 'percent', value: this.valorDesc() };

      const created = await this.ordersApi.create(payload);
      alert(`Compra confirmada! OC #${created?.number_seq ?? created?.id}`);
    } catch (e) {
      console.error('Falha ao criar ordem', e);
      alert('Falha ao criar ordem. Verifique a conex�o com o servidor.');
    }
    this.pdv.limpar();
  }

  cancelar(){
    if (confirm('Tem certeza que deseja cancelar?')) this.pdv.limpar();
  }

  // ==== Histórico (modal) ====
  readonly historyOpen = signal(false);
  readonly history = signal(this.oc.listHistory());
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly totalPages = computed(() => {
    const len = this.history().length;
    return Math.max(1, Math.ceil(len / this.pageSize));
  });
  readonly pageItems = computed(() => {
    const list = this.history();
    const start = (this.page() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  openHistory(){ this.refreshHistory(); this.historyOpen.set(true); this.page.set(1); try { document.body.classList.add('has-modal-open'); } catch {} }
  closeHistory(){ this.historyOpen.set(false); try { document.body.classList.remove('has-modal-open'); } catch {} }
  refreshHistory(){
    const list = this.oc.listHistory();
    // já salva como mais recente primeiro; se necessário, ordenar por dataISO desc
    this.history.set(list.sort((a,b) => (b.dataISO || '').localeCompare(a.dataISO || '')));
  }
  prevPage(){ this.page.update(p => Math.max(1, p - 1)); }
  nextPage(){ this.page.update(p => Math.min(this.totalPages(), p + 1)); }
  gotoPage(p: number){ this.page.set(Math.min(this.totalPages(), Math.max(1, Math.floor(p)))); }

  displayCliente(oc: any): string {
    const c = oc?.cliente || {};
    if (c.anonimo) return 'Anônimo';
    return c.nome || c.email || c.documento || c.telefone || '-';
  }

  requestDelete(numero: string){
    if (confirm(`Excluir lançamento #${numero}?`)){
      this.oc.delete(numero);
      this.refreshHistory();
    }
  }

  
}




