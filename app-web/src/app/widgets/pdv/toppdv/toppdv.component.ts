import { CommonModule } from '@angular/common';
import { Component, inject, signal, effect } from '@angular/core';
import { PdvStateService } from '../core/pdv-state.service';
import { ClientesService } from '../core/clientes.service';
import type { Cliente } from '../models/pdv.models';
import { AutocompleteInputComponent } from '../ui/autocomplete-input/autocomplete-input.component';

@Component({
  selector: 'pdv-toppdv',
  standalone: true,
  imports: [CommonModule, AutocompleteInputComponent],
  templateUrl: './toppdv.component.html',
  styleUrls: ['./toppdv.component.scss']
})
export class ToppdvComponent {
  readonly pdv = inject(PdvStateService);
  private readonly clientes = inject(ClientesService);

  nome = signal('');
  email = signal('');
  telefone = signal('');
  documento = signal('');
  emailValido = signal<boolean | null>(null);
  telefoneValido = signal<boolean | null>(null);
  documentoValido = signal<boolean | null>(null);

  anonimo = this.pdv.cliente().anonimo;

  constructor(){
    const c = this.pdv.cliente();
    this.nome.set(c.nome || '');
    this.email.set(c.email || '');
    this.telefone.set(c.telefone || '');
    this.documento.set(c.documento || '');

    // Mantém os campos sincronizados com o estado do PDV
    effect(() => {
      const cli = this.pdv.cliente();
      this.anonimo = cli.anonimo;
      this.nome.set(cli.nome || '');
      this.email.set(cli.email || '');
      this.telefone.set(cli.telefone || '');
      this.documento.set(cli.documento || '');
      // reset de validações ao receber novo estado
      this.emailValido.set(null);
      this.telefoneValido.set(null);
      this.documentoValido.set(null);
    });
  }

  async onSubmit(ev: Event){ ev.preventDefault(); }

  // limpa campos ao marcar anônimo
  toggleAnonimo(){
    this.pdv.toggleAnonimo();
    this.anonimo = this.pdv.cliente().anonimo;
    if (this.anonimo) {
      this.nome.set('');
      this.email.set('');
      this.telefone.set('');
      this.documento.set('');
      this.pdv.setCliente({ nome: '', email: '', telefone: '', documento: '' });
    }
  }

  updateCliente(){
    this.pdv.setCliente({
      nome: this.nome(),
      email: this.email(),
      telefone: this.telefone(),
      documento: this.documento(),
    });
  }

  // === máscaras/validações ===
  onNomeChange(v: string){ this.nome.set(v); this.updateCliente(); }

  onEmailChange(v: string){
    const s = v.trim();
    this.email.set(s);
    const ok = !!s && /.+@.+\..+/.test(s);
    this.emailValido.set(ok);
    this.updateCliente();
  }

  private onlyDigits(s: string){ return (s || '').replace(/\D+/g, ''); }

  onTelefoneChange(v: string){
    const d = this.onlyDigits(v).slice(0, 11);
    let f = d;
    if (d.length >= 2) {
      const ddd = d.slice(0,2);
      const rest = d.slice(2);
      if (rest.length > 5) f = `(${ddd}) ${rest.slice(0,rest.length-4)}-${rest.slice(-4)}`;
      else if (rest.length > 0) f = `(${ddd}) ${rest}`;
      else f = `(${ddd})`;
    }
    this.telefone.set(f);
    const validLen = d.length === 10 || d.length === 11;
    this.telefoneValido.set(validLen);
    this.updateCliente();
  }

  onDocumentoChange(v: string){
    const d = this.onlyDigits(v).slice(0, 11);
    let f = d;
    if (d.length > 9) {
      // CPF: 000.000.000-00 (quando 11 dígitos)
      const p1 = d.slice(0,3), p2 = d.slice(3,6), p3 = d.slice(6,9), p4 = d.slice(9,11);
      f = [p1, p2, p3].filter(Boolean).join('.') + (p4 ? '-' + p4 : '');
    } else if (d.length > 0) {
      // RG simplificado: 00.000.000-x
      const p1 = d.slice(0,2), p2 = d.slice(2,5), p3 = d.slice(5,8), p4 = d.slice(8);
      f = [p1, p2, p3].filter(Boolean).join('.') + (p4 ? '-' + p4 : '');
    }
    this.documento.set(f);
    this.documentoValido.set(d.length >= 9);
    this.updateCliente();
  }

  // search helpers
  // buscas com retorno do cliente completo (para auto-preencher)
  searchNome = (q: string) => this.clientes.searchFull('nome', q);
  searchEmail = (q: string) => this.clientes.searchFull('email', q);
  searchTel = (q: string) => this.clientes.searchFull('telefone', q);
  searchDoc = (q: string) => this.clientes.searchFull('documento', q);

  // display helpers para o autocomplete
  displayNome = (c: Cliente) => c?.nome || '';
  displayEmail = (c: Cliente) => c?.email || '';
  displayTel = (c: Cliente) => c?.telefone || '';
  displayDoc = (c: Cliente) => c?.documento || '';

  // quando escolher um cliente em qualquer campo, preenche todos os dados
  pickCliente(c: Cliente){
    if (!c) return;
    this.nome.set(c.nome || '');
    this.email.set(c.email || '');
    this.telefone.set(c.telefone || '');
    this.documento.set(c.documento || '');
    this.pdv.setCliente({ id: c.id, nome: this.nome(), email: this.email(), telefone: this.telefone(), documento: this.documento(), anonimo: false });
  }
}
