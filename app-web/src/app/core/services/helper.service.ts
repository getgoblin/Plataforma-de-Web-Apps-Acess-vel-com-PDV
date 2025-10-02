import { Injectable, signal } from '@angular/core';
import { HELPER_CONTENT, HelperKey } from '../content/helper.content';
import { AccessibilityService } from './accessibility.service';

@Injectable({ providedIn: 'root' })
export class HelperService {
  readonly enabled = signal(false);

  constructor(private readonly acc: AccessibilityService) {}

  toggle() { this.enabled.update(v => !v); }
  setEnabled(v: boolean) { this.enabled.set(v); }

  /** Anuncia uma dica usando o conteúdo estático */
  announce(key: HelperKey) {
    const item = HELPER_CONTENT[key];
    if (!item) return;
    this.acc.announce(item.announce);
  }
}
