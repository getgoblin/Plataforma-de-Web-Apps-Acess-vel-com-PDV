import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.tokens';

type LoginResponse = { token: string; user: { id: number; email: string; name?: string } };

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  async login(email: string, password: string): Promise<LoginResponse> {
    const url = `${this.base}/auth/login`;
    const resp = await this.http.post<LoginResponse>(url, { email, password }).toPromise();
    if (resp?.token) {
      try { localStorage.setItem('app:auth:token', resp.token); } catch {}
    }
    return resp as LoginResponse;
  }

  logout() { try { localStorage.removeItem('app:auth:token'); } catch {} }
}

