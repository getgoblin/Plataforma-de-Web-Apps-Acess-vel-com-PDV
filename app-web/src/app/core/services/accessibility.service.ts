import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private liveEl: HTMLElement | null = null;

  // === cria/pega um aria-live polite escondido ===
  private ensureLiveEl(): HTMLElement {
    if (this.liveEl && document.body.contains(this.liveEl)) return this.liveEl;
    const el = document.createElement('div');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    Object.assign(el.style, {
      position: 'fixed', width: '1px', height: '1px', overflow: 'hidden',
      clip: 'rect(1px, 1px, 1px, 1px)', clipPath: 'inset(50%)', whiteSpace: 'nowrap'
    } as CSSStyleDeclaration);
    document.body.appendChild(el);
    this.liveEl = el;
    return el;
  }

  /** Lê uma mensagem pelo leitor de tela. */
  announce(msg: string) {
    const el = this.ensureLiveEl();
    el.textContent = ''; // força re-anunciar a mesma string
    // pequeno delay garante repaint
    requestAnimationFrame(() => { el.textContent = msg; });
  }

  /** Move foco para um elemento com fallback. */
  focus(el: HTMLElement | null, opts: FocusOptions = { preventScroll: true }) {
    if (!el) return;
    try { el.focus(opts); } catch {}
  }
}
