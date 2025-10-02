import { Injectable, signal, computed } from '@angular/core';

/**
 * Serviço genérico de logs.
 * - Não assume formato do seu model.
 * - Você pode tipar com o seu LogEntry real via generics ao injetar, se quiser.
 *
 * Ex.: const logs = inject<LogsService<MyLogEntry>>(LogsService as unknown as InjectionToken<LogsService<MyLogEntry>>);
 */
@Injectable({ providedIn: 'root' })
export class LogsService<T extends object = any> {
  // estado
  private readonly _items = signal<T[]>([]);
  // selectors
  readonly items = computed(() => this._items());

  // ações
  append(entry: T) {
    this._items.update(list => [...list, entry]);
  }

  appendMany(entries: T[]) {
    if (!entries?.length) return;
    this._items.update(list => [...list, ...entries]);
  }

  clear() { this._items.set([]); }

  /**
   * Utilitário opcional: cria uma entrada a partir de um "builder"
   * para não acoplar ao formato do model.
   *
   * usage:
   *   logs.push(() => ({ id: uid(), message: 'ok', level: 'info', at: Date.now() } as MyLogEntry));
   */
  push(builder: () => T) {
    try {
      const entry = builder();
      this.append(entry);
    } catch {
      // ignora erro no builder
    }
  }
}
