import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.tokens';

export type ApiProduct = { id: number; code: string; name: string; price_cents: number; stock: number; active: boolean };

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  async search(term: string): Promise<ApiProduct[]> {
    const q = encodeURIComponent(term);
    const url = `${this.base}/products?search=${q}`;
    const data = await this.http.get<ApiProduct[]>(url).toPromise();
    return data || [];
  }

  async listAll(): Promise<ApiProduct[]> {
    const url = `${this.base}/products`;
    return (await this.http.get<ApiProduct[]>(url).toPromise()) || [];
  }
}

