import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.tokens';
import { OrdemCompraService } from '../../widgets/pdv/core/ordem-compra.service';
import { PdvStateService } from '../../widgets/pdv/core/pdv-state.service';

export type CreateOrderItem = { product_id: number; qty: number; unit_discount_pct?: number };
export type CreateOrderPayload = {
  client_id?: number;
  client?: { name?: string; email?: string; phone?: string; document?: string; anonymous?: boolean };
  payment_method: 'dinheiro' | 'cartao' | 'pix';
  installments: number;
  items: CreateOrderItem[];
  order_discount?: { type: 'value' | 'percent'; value: number };
};

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly oc = inject(OrdemCompraService);
  private readonly pdv = inject(PdvStateService);

  async create(payload: CreateOrderPayload): Promise<any> {
    const url = `${this.base}/orders`;
    const res: any = await this.http.post(url, payload).toPromise();
    try {
      // registra historico local apos sucesso no backend
      const remoteNo = (res && (res.number_seq ?? res.id ?? res.number)) ? String(res.number_seq ?? res.id ?? res.number) : undefined;
      this.oc.createFromState(this.pdv, payload.installments || 1, remoteNo);
    } catch {}
    return res;
  }
}
