import { Injectable, signal, computed } from '@angular/core';
import { User } from '../../models/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  // TEMP: deixe um usuário padrão só pra ver na tela; depois o login vai setar isso.
  private readonly _user = signal<User | null>({ id: 'seed', name: 'user' });

  readonly user = computed(() => this._user());
  readonly userName = computed(() => this._user()?.name ?? '');

  login(name: string) {
    this._user.set({ id: String(Date.now()), name });
  }

  logout() {
    this._user.set(null);
  }
}
