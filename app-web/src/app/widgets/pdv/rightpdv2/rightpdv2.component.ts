import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, effect, ElementRef, AfterViewInit } from '@angular/core';
import { PdvStateService } from '../core/pdv-state.service';
import { OrdemCompraService, OrdemCompra } from '../core/ordem-compra.service';
import { OrdersApiService } from '../../../core/api/orders-api.service';
import { ClientsApiService } from '../../../core/api/clients-api.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'pdv-rightpdv',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './rightpdv2.component.html',
  styleUrls: ['../rightpdv/rightpdv.component.scss']
})
export class Rightpdv2Component implements AfterViewInit {
  readonly pdv = inject(PdvStateService);
  private readonly oc = inject(OrdemCompraService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly clientsApi = inject(ClientsApiService);
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  tipoDesc = signal<'percentual' | 'valor'>(this.pdv.descontoTotal().tipo);
  valorDesc = signal(this.pdv.descontoTotal().valor);

  subtotal = this.pdv.subtotal;
  totalDescontosUnit = this.pdv.totalDescontosUnitarios;
  descontoTotalAplicado = this.pdv.descontoTotalAplicado;
  valorDescontado = this.pdv.valorDescontado;
  totalAPagar = this.pdv.totalAPagar;
  readonly maxDescValorBase = computed(() => Math.max(0, this.subtotal() - this.totalDescontosUnit()));

  // parcelas (somente para cartao)
  readonly parcelasSel = signal(1);
  readonly parcelasOpts = computed(() => {
    const total = this.totalAPagar();
    const minPer = 50; // valor minimo por parcela (simulador)
    const maxByValue = Math.floor(total / minPer);
    const max = Math.max(1, Math.min(12, isFinite(maxByValue) ? maxByValue : 1));
    return Array.from({ length: max }, (_, i) => i + 1);
  });
  readonly valorParcela = computed(() => this.totalAPagar() / Math.max(1, this.parcelasSel()));

  constructor(){
    // garante que selecao de parcelas esteja dentro do range quando total muda
    effect(() => {
      const max = this.parcelasOpts().length || 1;
      const cur = this.parcelasSel();
      if (cur > max) this.parcelasSel.set(max);
      if (cur < 1) this.parcelasSel.set(1);
    });

    // sincroniza UI quando estado do PDV é limpo/alterado externamente
    effect(() => {
      const d = this.pdv.descontoTotal();
      this.tipoDesc.set(d.tipo);
      this.valorDesc.set(d.valor);
      const forma = this.pdv.formaPgto();
      if (forma !== 'cartao') this.parcelasSel.set(1);
    });
  }

  ngAfterViewInit(): void {
    try {
      const root = this.host.nativeElement;
      // Botão Cartão
      root.querySelectorAll<HTMLButtonElement>('.rp__btns > button').forEach((btn: HTMLButtonElement) => {
        const t = (btn.textContent || '').trim();
        if (/cart/i.test(t)) {
          btn.setAttribute('data-help', 'Receber no cartão (permite parcelar).');
        }
      });
      // Botão Histórico
      const hist = root.querySelector<HTMLButtonElement>('.rp__btn--history');
      if (hist) hist.setAttribute('data-help', 'Ver histórico de lançamentos.');
    } catch {}
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
      // integra cliente: merge sempre que houver dados (mesmo se marcado anônimo por engano)
      try {
        if (c.nome || c.email || c.telefone || c.documento) {
          if (c.id && !Number.isNaN(+c.id)) {
            const updated = await this.clientsApi.update(+c.id, {
              name: c.nome || undefined,
              email: c.email || undefined,
              phone: c.telefone || undefined,
              document: c.documento || undefined,
              anonymous: false,
            });
            // sincroniza estado com o que o servidor retornou
            this.pdv.setCliente({ id: String(updated.id), nome: updated.name || c.nome, email: updated.email || c.email, telefone: updated.phone || c.telefone, documento: updated.document || c.documento, anonimo: false });
          } else {
            // sem id: tenta localizar um existente pela busca e atualizar o primeiro match exato por documento/email/telefone
            const queryKey = c.documento || c.email || c.telefone || c.nome || '';
            const found = queryKey ? await this.clientsApi.search(queryKey, 5) : [];
            const match = found.find(f => (c.documento && f.document === c.documento) || (c.email && f.email === c.email) || (c.telefone && f.phone === c.telefone) || (c.nome && f.name === c.nome));
            if (match) {
              const updated = await this.clientsApi.update(match.id, {
                name: c.nome || match.name,
                email: c.email || match.email,
                phone: c.telefone || match.phone,
                document: c.documento || match.document,
                anonymous: false,
              });
              this.pdv.setCliente({ id: String(updated.id), nome: updated.name || c.nome, email: updated.email || c.email, telefone: updated.phone || c.telefone, documento: updated.document || c.documento, anonimo: false });
            } else {
              const created = await this.clientsApi.create({
                name: c.nome || undefined,
                email: c.email || undefined,
                phone: c.telefone || undefined,
                document: c.documento || undefined,
                anonymous: false,
              });
              this.pdv.setCliente({ id: String(created.id), nome: created.name || c.nome, email: created.email || c.email, telefone: created.phone || c.telefone, documento: created.document || c.documento, anonimo: false });
            }
          }
        }
      } catch {}

      const created = await this.ordersApi.create(payload);
      alert(`Compra confirmada! OC #${created?.number_seq ?? created?.id ?? ''}`);
    } catch (e) {
      console.error('Falha ao criar ordem', e);
      alert('Falha ao criar ordem. Verifique a conexao com o servidor.');
    }
    this.pdv.limpar();
  }

  cancelar(){
    if (confirm('Tem certeza que deseja cancelar?')) this.pdv.limpar();
  }

  // ==== Historico (modal) ====
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
    // salva como mais recente primeiro; se necessario, ordenar por dataISO desc
    this.history.set(list.sort((a,b) => (b.dataISO || '').localeCompare(a.dataISO || '')));
  }
  prevPage(){ this.page.update(p => Math.max(1, p - 1)); }
  nextPage(){ this.page.update(p => Math.min(this.totalPages(), p + 1)); }
  gotoPage(p: number){ this.page.set(Math.min(this.totalPages(), Math.max(1, Math.floor(p)))); }

  displayCliente(oc: any): string {
    const c = oc?.cliente || {};
    if (c.anonimo) return 'Anonimo';
    return c.nome || c.email || c.documento || c.telefone || '-';
  }

  requestDelete(numero: string){
    if (confirm(`Excluir lancamento #${numero}?`)){
      this.oc.delete(numero);
      this.refreshHistory();
    }
  }

  printOc(oc: OrdemCompra){
    this.oc.printCompact(oc);
  }
}
