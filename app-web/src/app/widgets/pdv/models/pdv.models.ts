export type FormaPgto = 'dinheiro' | 'cartao' | 'pix';

export interface DescontoTotal {
  tipo: 'percentual' | 'valor';
  valor: number; // percentual (0-100) se tipo='percentual', senão valor absoluto
}

export interface Cliente {
  id?: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string; // cpf/rg
  anonimo: boolean;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  precoUnit: number; // em moeda
  estoque?: number;
}

export interface ItemCarrinho {
  idLinha: string;
  produtoId: string;
  codigo: string;
  nome: string;
  qtd: number;
  precoUnit: number;
  descontoPctUnit: number; // 0-100
}

export function totalBrutoItem(i: ItemCarrinho): number {
  return i.precoUnit * i.qtd;
}

export function totalLiquidoItem(i: ItemCarrinho): number {
  const bruto = totalBrutoItem(i);
  const desc = (i.descontoPctUnit / 100) * bruto;
  return Math.max(0, bruto - desc);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

