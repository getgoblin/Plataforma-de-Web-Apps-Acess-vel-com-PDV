import { Injectable, inject } from '@angular/core';
import { PdvStateService } from './pdv-state.service';
import { Cliente, ItemCarrinho } from '../models/pdv.models';

export interface OrdemCompraItem {
  codigo: string;
  nome: string;
  qtd: number;
  precoUnit: number;
  descontoPctUnit: number;
}

export interface OrdemCompra {
  numero: string; // sequencial formatado
  dataISO: string;
  cliente: Cliente;
  itens: OrdemCompraItem[];
  subtotal: number;
  descontosUnit: number;
  descontoTotalAplicado: number;
  totalDescontado: number;
  totalAPagar: number;
  formaPgto: 'dinheiro' | 'cartao' | 'pix';
  parcelas: number; // 1 para não-cartão
}

const LS_LAST_NO = 'pdv:oc:lastNo';
const LS_HISTORY = 'pdv:oc:history';

@Injectable({ providedIn: 'root' })
export class OrdemCompraService {
  private readLastNo(): number {
    try { return parseInt(localStorage.getItem(LS_LAST_NO) || '0', 10) || 0; } catch { return 0; }
  }
  private writeLastNo(n: number) { try { localStorage.setItem(LS_LAST_NO, String(n)); } catch {} }

  private nextNumero(): string {
    const n = this.readLastNo() + 1;
    this.writeLastNo(n);
    return n.toString().padStart(6, '0');
  }

  private pushHistory(oc: OrdemCompra) {
    try {
      const arr: OrdemCompra[] = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
      arr.unshift(oc);
      localStorage.setItem(LS_HISTORY, JSON.stringify(arr).toString());
    } catch {}
  }

  listHistory(): OrdemCompra[] {
    try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch { return []; }
  }

  delete(numero: string) {
    try {
      const arr: OrdemCompra[] = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
      const filtered = arr.filter(o => o.numero !== numero);
      localStorage.setItem(LS_HISTORY, JSON.stringify(filtered));
    } catch {}
  }

  createFromState(pdv: PdvStateService, parcelas: number = 1, numeroOverride?: string): OrdemCompra {
    const numero = (numeroOverride && String(numeroOverride)) || this.nextNumero();
    const cliente = { ...pdv.cliente() };
    const itens: OrdemCompraItem[] = pdv.itens().map(i => ({
      codigo: i.codigo,
      nome: i.nome,
      qtd: i.qtd,
      precoUnit: i.precoUnit,
      descontoPctUnit: i.descontoPctUnit,
    }));
    const subtotal = pdv.subtotal();
    const descontosUnit = pdv.totalDescontosUnitarios();
    const descontoTotalAplicado = pdv.descontoTotalAplicado();
    const totalDescontado = pdv.valorDescontado();
    const totalAPagar = pdv.totalAPagar();
    const formaPgto = pdv.formaPgto();
    const oc: OrdemCompra = {
      numero,
      dataISO: new Date().toISOString(),
      cliente,
      itens,
      subtotal,
      descontosUnit,
      descontoTotalAplicado,
      totalDescontado,
      totalAPagar,
      formaPgto,
      parcelas: formaPgto === 'cartao' ? Math.max(1, parcelas | 0) : 1,
    };
    this.pushHistory(oc);
    return oc;
  }

  print(oc: OrdemCompra) {
    const win = window.open('', '_blank');
    if (!win) return;
    const styles = `
      body{ font:14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding:16px; }
      h1{ font-size:18px; margin:0 0 8px; }
      table{ width:100%; border-collapse:collapse; margin-top:8px }
      th,td{ border-bottom:1px solid #ddd; padding:6px; text-align:left }
      tfoot td{ font-weight:700 }
      .muted{ color:#555 }
    `;
    const parcelasTxt = oc.formaPgto === 'cartao' ? `${oc.parcelas}x de R$ ${(oc.totalAPagar/oc.parcelas).toFixed(2)}` : '';
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>OC ${oc.numero}</title><style>${styles}</style></head>
    <body>
      <h1>Ordem de Compra #${oc.numero}</h1>
      <div class="muted">${new Date(oc.dataISO).toLocaleString()}</div>
      <h3>Cliente</h3>
      <div>${oc.cliente.anonimo ? 'Anônimo' : (oc.cliente.nome || '-')}</div>
      <div class="muted">${oc.cliente.email || ''} ${oc.cliente.telefone ? ' | '+oc.cliente.telefone : ''} ${oc.cliente.documento ? ' | '+oc.cliente.documento : ''}</div>
      <h3>Itens</h3>
      <table>
        <thead><tr><th>Código</th><th>Produto</th><th>Qtd</th><th>Unitário</th><th>Desc%</th><th>Total</th></tr></thead>
        <tbody>
          ${oc.itens.map(i => `<tr><td>${i.codigo}</td><td>${i.nome}</td><td>${i.qtd}</td><td>R$ ${i.precoUnit.toFixed(2)}</td><td>${i.descontoPctUnit}%</td><td>R$ ${(i.qtd*i.precoUnit*(1 - i.descontoPctUnit/100)).toFixed(2)}</td></tr>`).join('')}
        </tbody>
        <tfoot>
          <tr><td colspan="5">Subtotal</td><td>R$ ${oc.subtotal.toFixed(2)}</td></tr>
          <tr><td colspan="5">Descontos</td><td>- R$ ${oc.totalDescontado.toFixed(2)}</td></tr>
          <tr><td colspan="5">Total</td><td>R$ ${oc.totalAPagar.toFixed(2)}</td></tr>
        </tfoot>
      </table>
      <h3>Pagamento</h3>
      <div>Forma: ${oc.formaPgto.toUpperCase()} ${parcelasTxt ? ' - ' + parcelasTxt : ''}</div>
      <script>window.onload = () => setTimeout(() => { window.print(); }, 200);</script>
    </body></html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  // Versão compacta, estilo cupom/mercado
  printCompact(oc: OrdemCompra) {
    const win = window.open('', '_blank');
    if (!win) return;

    const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dataStr = new Date(oc.dataISO).toLocaleString('pt-BR');
    const parcelasTxt = oc.formaPgto === 'cartao' && oc.parcelas > 1
      ? `${oc.parcelas}x de R$ ${fmt(oc.totalAPagar / oc.parcelas)}`
      : '';

    const itemsHtml = oc.itens.map(i => {
      const totalItem = i.qtd * i.precoUnit * (1 - i.descontoPctUnit / 100);
      const descTxt = i.descontoPctUnit ? ` <span class="muted">(-${i.descontoPctUnit}% )</span>` : '';
      return `
        <div class="line name">${i.nome}</div>
        <div class="line meta">${i.codigo} • ${i.qtd} x R$ ${fmt(i.precoUnit)}${descTxt}<span class="right">R$ ${fmt(totalItem)}</span></div>
      `;
    }).join('');

    const styles = `
      @page { size: 72mm auto; margin: 0; }
      html,body{ margin:0; padding:0; }
      body{ font: 12px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
      .rec{ width:72mm; padding: 8mm 6mm; box-sizing: border-box; }
      .title{ text-align:center; font-weight:700; margin-bottom:4px; }
      .muted{ color:#444; }
      .small{ font-size:11px; }
      .sep{ margin:6px 0; border-top:1px dashed #999; }
      .line{ display:flex; align-items:baseline; }
      .line .right{ margin-left:auto; }
      .line.name{ font-weight:600; margin-top:4px; }
      .line.meta{ color:#444; }
      .tot{ font-weight:700; font-size:13px; }
      .foot{ text-align:center; margin-top:8px; color:#444; }
    `;

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>OC ${oc.numero}</title><style>${styles}</style></head>
    <body>
      <div class="rec">
        <div class="title">Comprovante de Compra</div>
        <div class="small muted" style="text-align:center;">OC #${oc.numero} • ${dataStr}</div>
        <div class="sep"></div>
        <div class="line"><span>Cliente</span><span class="right">${oc.cliente.anonimo ? 'Anônimo' : (oc.cliente.nome || '-')}</span></div>
        ${oc.cliente.email ? `<div class=\"line small muted\"><span>E-mail</span><span class=\"right\">${oc.cliente.email}</span></div>` : ''}
        ${oc.cliente.telefone ? `<div class=\"line small muted\"><span>Telefone</span><span class=\"right\">${oc.cliente.telefone}</span></div>` : ''}
        ${oc.cliente.documento ? `<div class=\"line small muted\"><span>Documento</span><span class=\"right\">${oc.cliente.documento}</span></div>` : ''}
        <div class="sep"></div>
        ${itemsHtml}
        <div class="sep"></div>
        <div class="line"><span class="muted">Subtotal</span><span class="right">R$ ${fmt(oc.subtotal)}</span></div>
        <div class="line"><span class="muted">Descontos</span><span class="right">- R$ ${fmt(oc.totalDescontado)}</span></div>
        <div class="line tot"><span>Total</span><span class="right">R$ ${fmt(oc.totalAPagar)}</span></div>
        <div class="sep"></div>
        <div class="line"><span>Pagamento</span><span class="right">${oc.formaPgto.toUpperCase()}${parcelasTxt ? ' • ' + parcelasTxt : ''}</span></div>
        <div class="foot small">Obrigado pela preferência!</div>
      </div>
      <script>window.onload = () => setTimeout(() => { window.print(); }, 150);</script>
    </body></html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}
