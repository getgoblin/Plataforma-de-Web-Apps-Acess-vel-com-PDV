import { Injectable, inject } from '@angular/core';
import { Produto } from '../models/pdv.models';
import { ProductsApiService } from '../../../core/api/products-api.service';

@Injectable({ providedIn: 'root' })
export class ProdutosService {
  private readonly api = inject(ProductsApiService);
  private norm(s: string) { return (s || '').toLowerCase(); }

  async search(query: string): Promise<Produto[]> {
    const q = query?.trim();
    if (!q) return [];
    const list = await this.api.search(q);
    return list.map(p => ({ id: String(p.id), codigo: p.code, nome: p.name, precoUnit: p.price_cents / 100 }));
  }

  async getByCodigoOrNome(term: string): Promise<Produto | null> {
    const q = term?.trim(); if (!q) return null;
    const list = await this.api.search(q);
    if (!list.length) return null;
    const n = this.norm(q);
    const hit = list.find(p => this.norm(p.code) === n) || list.find(p => this.norm(p.name) === n) || list[0];
    return { id: String(hit.id), codigo: hit.code, nome: hit.name, precoUnit: hit.price_cents / 100 };
  }

  async listAll(): Promise<Produto[]> {
    const list = await this.api.listAll();
    return list.map(p => ({ id: String(p.id), codigo: p.code, nome: p.name, precoUnit: p.price_cents / 100 }));
  }
}


