import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.tokens';

export type ApiClient = { id: number; name?: string; email?: string; phone?: string; document?: string; anonymous?: boolean; created_at: string };

@Injectable({ providedIn: 'root' })
export class ClientsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  async search(query: string, limit = 20): Promise<ApiClient[]> {
    const url = `${this.base}/clients?query=${encodeURIComponent(query)}&limit=${limit}`;
    return (await this.http.get<ApiClient[]>(url).toPromise()) || [];
  }

  async create(c: Partial<ApiClient>): Promise<ApiClient> {
    const url = `${this.base}/clients`;
    return await this.http.post<ApiClient>(url, c).toPromise() as ApiClient;
  }

  async update(id: number, c: Partial<ApiClient>): Promise<ApiClient> {
    const url = `${this.base}/clients/${id}`;
    return await this.http.put<ApiClient>(url, c).toPromise() as ApiClient;
  }
}
