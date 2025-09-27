import { Injectable, signal, computed, effect } from '@angular/core';
import { User } from '../../models/user';

const LS_USER_KEY = 'app:user';

@Injectable({ providedIn: 'root' })
export class UserService {
  // carrega do localStorage ao iniciar
  private readonly _user = signal<User | null>(UserService.readUser());

  /** sinal público somente leitura */
  readonly user = this._user.asReadonly();
  /** apenas o nome (string vazia se null) */
  readonly userName = computed(() => this._user()?.name ?? '');
  readonly isLoggedIn = computed(() => !!this._user());

  
  constructor() {
    effect(() => {
      const u = this._user();
      try {
        if (u) localStorage.setItem(LS_USER_KEY, JSON.stringify(u));
        else localStorage.removeItem(LS_USER_KEY);
      } catch {}
    });

    // sincroniza entre abas
    window.addEventListener('storage', (e) => {
      if (e.key !== LS_USER_KEY) return;
      this._user.set(UserService.readUser());
    });
  }

  updateName(name: string) {
  const u = this._user();
  if (!u) return;
  const trimmed = (name ?? '').trim();
  if (!trimmed) return;
  this._user.set({ ...u, name: trimmed });
}


  /** login mínimo só com nome; ajuste conforme seu modelo */
  login(name: string) {
    const trimmed = (name ?? '').trim();
    if (!trimmed) return; // opcional: lance erro ou valide no form
    const user: User = { id: UserService.cryptoRandom(), name: trimmed };
    this._user.set(user);
  }

  logout() {
    this._user.set(null);
  }

  /** helpers estáticos */
  private static readUser(): User | null {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private static cryptoRandom(): string {
    try {
      const n = crypto.getRandomValues(new Uint32Array(2));
      return (Date.now().toString(36) + n[0].toString(36) + n[1].toString(36));
    } catch {
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
  }
}
