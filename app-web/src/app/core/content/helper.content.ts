export type HelperKey =
  | 'widgets-open' | 'widgets-close'
  | 'user-menu' | 'help-pdf' | 'logoff'
  | 'hotkeys' | 'helper' | 'visual'
  | 'right-expand' | 'wm-slot' | 'wm-close';

export type HelperItem = Readonly<{
  title: string;
  description: string;
  announce: string;
}>;

export const HELPER_CONTENT: Readonly<Record<HelperKey, HelperItem>> = {
  'widgets-open':  { title: 'Aplicativos', description: 'Abrir lista de apps.',  announce: 'Abrindo lista de aplicativos.' },
  'widgets-close': { title: 'Fechar',      description: 'Fechar lista de apps.', announce: 'Fechando lista de aplicativos.' },

  'user-menu':     { title: 'Usuário',     description: 'Abrir menu do usuário.', announce: 'Menu do usuário aberto.' },
  'help-pdf':      { title: 'Ajuda',       description: 'Abrir manual em PDF.',   announce: 'Abrindo manual de ajuda.' },
  'logoff':        { title: 'Sair',        description: 'Encerrar sessão.',       announce: 'Encerrando sessão.' },

  // helpers agora no UserMenu (toggle)
  'hotkeys':       { title: 'Atalhos',     description: 'Ativar/desativar atalhos de teclado.', announce: 'Atalhos de teclado atualizados.' },
  'helper':        { title: 'Helper',      description: 'Ativar/desativar dicas contextuais.',    announce: 'Dicas contextuais atualizadas.' },
  'visual':        { title: 'Leitor',      description: 'Ativar/desativar leitor e acessibilidade.', announce: 'Leitor de tela atualizado.' },

  'right-expand':  { title: 'Logger',      description: 'Expandir/retrair logs.', announce: 'Painel de logs.' },
  'wm-slot':       { title: 'Janela',      description: 'Focar/minimizar janela.',announce: 'Janela selecionada.' },
  'wm-close':      { title: 'Fechar',      description: 'Fechar janela.',         announce: 'Janela fechada.' },
} as const;
