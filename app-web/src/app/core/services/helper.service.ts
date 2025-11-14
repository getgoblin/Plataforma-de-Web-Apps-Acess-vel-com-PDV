import { Injectable, effect, signal } from '@angular/core';
import { HELPER_CONTENT, HelperKey } from '../content/helper.content';
import { AccessibilityService } from './accessibility.service';

@Injectable({ providedIn: 'root' })
export class HelperService {
  readonly enabled = signal(false);

  private overlay: HTMLDivElement | null = null;
  private lastText = '';
  private mouseHandler?: (e: MouseEvent) => void;

  constructor(private readonly acc: AccessibilityService) {
    effect(() => {
      const on = this.enabled();
      document.body.classList.toggle('helper-on', on);
      document.body.classList.toggle('js-help', on); // desliga CSS puro quando JS está ativo
      if (on) this.attach();
      else this.detach();
    });
  }

  toggle() { this.enabled.update(v => !v); }
  setEnabled(v: boolean) { this.enabled.set(v); }

  /** Anuncia uma dica usando o conteúdo estático */
  announce(key: HelperKey) {
    const item = HELPER_CONTENT[key];
    if (!item) return;
    this.acc.announce(item.announce);
  }

  // === overlay runtime ===
  private ensureOverlay(): HTMLDivElement {
    if (this.overlay && document.body.contains(this.overlay)) return this.overlay;
    const el = document.createElement('div');
    el.setAttribute('role', 'tooltip');
    el.className = 'helper-bubble';
    Object.assign(el.style, {
      position: 'fixed',
      zIndex: '2147483647',
      top: '0', left: '0',
      padding: '6px 8px',
      borderRadius: '8px',
      border: '1px solid transparent',
      background: 'var(--accent)',
      color: 'var(--on-accent)',
      boxShadow: 'var(--shadow-1)',
      font: '12px/1.25 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      pointerEvents: 'none',
      opacity: '0',
      transform: 'translate(-9999px,-9999px)',
      transition: 'opacity .12s ease',
      maxWidth: '360px',
      whiteSpace: 'nowrap',
    } as CSSStyleDeclaration);
    document.body.appendChild(el);
    this.overlay = el;
    return el;
  }

  private attach() {
    if (this.mouseHandler) return;
    const onMove = (e: MouseEvent) => this.onMove(e);
    this.mouseHandler = onMove;
    document.addEventListener('mousemove', onMove, true);
    // melhora dicas padrão em elementos conhecidos (quando helper é ligado)
    try { setTimeout(() => this.enhanceDefaultHints(), 0); } catch {}
  }
  private detach() {
    if (this.mouseHandler) document.removeEventListener('mousemove', this.mouseHandler, true);
    this.mouseHandler = undefined;
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      this.overlay.style.transform = 'translate(-9999px,-9999px)';
    }
  }

  private onMove(e: MouseEvent) {
    const target = e.target as Element | null;
    const el = target ? (this.findHelpEl(target)) : null;
    const text = el ? (el.getAttribute('data-help') || el.getAttribute('aria-label') || el.getAttribute('title') || '') : '';
    const bubble = this.ensureOverlay();
    if (!text) {
      bubble.style.opacity = '0';
      return;
    }
    if (text !== this.lastText) {
      bubble.textContent = text;
      this.lastText = text;
    }
    // position near cursor, keep inside viewport
    const margin = 12;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    bubble.style.opacity = '1';
    bubble.style.transform = 'translate(-9999px,-9999px)';
    // force layout to measure
    const rect = bubble.getBoundingClientRect();
    let x = e.clientX + 14;
    let y = e.clientY + 16;
    if (x + rect.width + margin > viewportW) x = Math.max(margin, e.clientX - rect.width - 14);
    if (y + rect.height + margin > viewportH) y = Math.max(margin, e.clientY - rect.height - 16);
    bubble.style.transform = `translate(${x}px, ${y}px)`;
  }

  private findHelpEl(el: Element): Element | null {
    let cur: Element | null = el;
    for (let i = 0; i < 6 && cur; i++) {
      if (cur.hasAttribute('data-help') || cur.hasAttribute('aria-label') || cur.hasAttribute('title')) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  // Seta data-help em elementos comuns que possam não ter dica específica
  private enhanceDefaultHints() {
    try {
      // Botão Cartão (painel PDV): procura por botões em .rp__btns cujo texto contenha "Cart"
      document.querySelectorAll<HTMLButtonElement>('.rp__btns > button').forEach(btn => {
        const t = (btn.textContent || '').trim();
        if (!btn.hasAttribute('data-help') && /cart/i.test(t)) {
          btn.setAttribute('data-help', 'Receber no cart�o (permite parcelar).');
        }
      });
      // Botão Histórico no PDV
      document.querySelectorAll<HTMLButtonElement>('.rp__btn--history').forEach(btn => {
        if (!btn.hasAttribute('data-help')) btn.setAttribute('data-help', 'Ver hist�rico de lan�amentos.');
      });
    } catch {}
  }
}
