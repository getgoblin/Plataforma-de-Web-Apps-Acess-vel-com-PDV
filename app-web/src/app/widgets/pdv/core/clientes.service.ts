import { Injectable, inject } from '@angular/core';
import { Cliente } from '../models/pdv.models';
import { ClientsApiService } from '../../../core/api/clients-api.service';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly api = inject(ClientsApiService);
  private norm(s: string) { return (s || '').toLowerCase(); }

  async searchField(field: keyof Pick<Cliente, 'nome' | 'email' | 'telefone' | 'documento'>, q: string): Promise<string[]> {
    const n = this.norm(q);
    if (!n) return [];
    const res = await this.api.search(q, 20);
    const set = new Set<string>();
    for (const c of res) {
      const map: Cliente = {
        id: String(c.id),
        nome: c.name || '',
        email: c.email || '',
        telefone: c.phone || '',
        documento: c.document || '',
        anonimo: !!c.anonymous
      };
      const v = (map[field] || '').toString();
      if (this.norm(v).includes(n)) set.add(v);
    }
    return Array.from(set).slice(0, 10);
  }

  async searchByName(q: string): Promise<Cliente[]> {
    const n = this.norm(q);
    if (!n) return [];
    const res = await this.api.search(q, 20);
    return res.map(c => ({ id: String(c.id), nome: c.name || '', email: c.email || '', telefone: c.phone || '', documento: c.document || '', anonimo: !!c.anonymous }));
  }

  async searchFull(field: keyof Pick<Cliente, 'nome'|'email'|'telefone'|'documento'>, q: string): Promise<Cliente[]> {
    const n = this.norm(q);
    if (!n) return [];
    const res = await this.api.search(q, 50);
    const list = res.map(c => ({ id: String(c.id), nome: c.name || '', email: c.email || '', telefone: c.phone || '', documento: c.document || '', anonimo: !!c.anonymous }));
    const filtered = list.filter(c => this.norm(String(c[field] || '')).includes(n));
    const sorted = filtered.sort((a, b) => String(a[field]||'').localeCompare(String(b[field]||'')));
    // remove duplicados por (nome/email/telefone/documento)
    const seen = new Set<string>();
    const uniq: Cliente[] = [];
    for (const c of sorted) {
      const key = `${c.nome}|${c.email}|${c.telefone}|${c.documento}`;
      if (!seen.has(key)) { seen.add(key); uniq.push(c); }
    }
    return uniq.slice(0, 20);
  }
}
