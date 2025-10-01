// === deps/imports ===
import { Injectable, signal, computed, effect } from '@angular/core';
import { User } from '../../models/user';

// === consts/keys ===
const LS_USER_KEY = 'app:user';

// === service ===
@Injectable({ providedIn: 'root' })
export class UserService {
  // --- state/signals ---
  private readonly _user = signal<User | null>(UserService.readUser());

  // --- selectors/computed ---
  readonly user = this._user.asReadonly();
  readonly userName = computed(() => this._user()?.name ?? '');
  readonly isLoggedIn = computed(() => !!this._user());

  // --- ctor: persistência + sync cross-tab ---
  constructor() {
    // persiste user (ou remove)
    effect(() => {
      const u = this._user();
      try {
        if (u) localStorage.setItem(LS_USER_KEY, JSON.stringify(u));
        else localStorage.removeItem(LS_USER_KEY);
      } catch {}
    });

    // sincroniza entre abas
    try {
      window.addEventListener('storage', (e) => {
        if (e.key !== LS_USER_KEY) return;
        this._user.set(UserService.readUser());
      });
    } catch {}
  }

  // === actions ===
  updateName(name: string) {
    const u = this._user();
    if (!u) return;
    const trimmed = (name ?? '').trim();
    if (!trimmed) return;
    this._user.set({ ...u, name: trimmed });
  }

  login(name: string) {
    const trimmed = (name ?? '').trim();
    if (!trimmed) return; // valide no form se preferir
    const user: User = { id: UserService.cryptoRandom(), name: trimmed };
    this._user.set(user);
  }

  logout() { this._user.set(null); }

  // === static helpers ===
  private static readUser(): User | null {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch { return null; }
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
