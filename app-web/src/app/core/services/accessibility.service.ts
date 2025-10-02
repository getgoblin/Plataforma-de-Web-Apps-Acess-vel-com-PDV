import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private liveEl: HTMLElement | null = null;
  readonly enabled = signal(false);

  private ensureLiveEl(): HTMLElement {
    if (this.liveEl && document.body.contains(this.liveEl)) return this.liveEl;
    const el = document.createElement('div');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    Object.assign(el.style, {
      position:'fixed', width:'1px', height:'1px', overflow:'hidden',
      clip:'rect(1px,1px,1px,1px)', clipPath:'inset(50%)', whiteSpace:'nowrap'
    } as CSSStyleDeclaration);
    document.body.appendChild(el);
    this.liveEl = el;
    return el;
  }

  announce(msg: string) {
    if (!this.enabled()) return; // só anuncia se ligado
    const el = this.ensureLiveEl();
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = msg; });
  }

  focus(el: HTMLElement | null, opts: FocusOptions = { preventScroll: true }) {
    if (!el) return;
    try { el.focus(opts); } catch {}
  }

  toggle() { this.enabled.update(v => !v); }
  setEnabled(v: boolean) { this.enabled.set(v); }
}
