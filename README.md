# Dashboard Widget

Aplicação web com um “launcher” de widgets (ex.: PDV) e um backend simples. O objetivo é abrir pequenos apps dentro de janelas, com barras laterais de ferramentas, catálogo de aplicativos, acessibilidade e um fluxo de vendas completo.

## Principais Recursos

- Catálogo de aplicativos (widget‑menu) com abertura dinâmica de widgets.
- Fechamento do catálogo ao clicar fora do painel.
- Barras laterais esquerda/direita com ferramentas (logger, to‑do, notas).
- Janelas de widgets com foco/minimizar via `WindowsService`.
- Helper/acessibilidade: dicas contextuais lendo `data-help`/`aria-label`.
- Widget PDV completo: cliente, produtos, descontos, formas de pagamento e histórico/impressão.
- Anti‑duplicação de clientes com UPSERT, merge de dados e índices únicos.

## Tecnologias

- Front‑end: Angular (standalone), Signals (signal/effect/computed), TypeScript, SCSS.
- Back‑end: Node.js, Express, SQLite (better‑sqlite3), JWT, CORS, dotenv.

## Estrutura do Projeto

```
app-web/                 # Front-end Angular
  src/app/
    core/               # serviços, API, modelos, acessibilidade
    features/shell/     # layout (top/left/right bars), overlay de widgets
    shared/             # componentes reutilizáveis (modal, botões, etc.)
    widgets/            # aplicativos (PDV, etc.)
api/                     # Back-end Express + SQLite
  src/lib/db.js         # schema + conexão
  src/routes/*.js       # rotas: auth, products, clients, orders
```

## Como Rodar (Desenvolvimento)

1) API
- Pré‑requisitos: Node 18+.
- Passos:
```
cd api
cp .env.example .env   # ajuste PORT/JWT_SECRET se quiser
npm install
npm run seed           # dados de exemplo
npm run dev            # inicia em http://localhost:4000
```
- Credenciais seed: `admin@example.com` / `admin123`.

2) App Web
```
cd app-web
npm install
npm start              # abre o Angular em http://localhost:4200
```

O front usa `API_BASE_URL` em `app-web/src/app/app.config.ts` (por padrão: `http://localhost:4000`).

## Catálogo de Widgets (Launcher)

- Código: `app-web/src/app/features/shell/widgets-overlay/*`.
- Lista metadados vindos do `WidgetsRegistryService` e abre o componente do widget sob demanda.
- Fecha ao clicar fora do painel.

## Sistema de Widgets

- Registro dinâmico: `core/services/widgets-registry.service.ts` (import lazy dos widgets). Cada widget exporta `WIDGET_META` e `WIDGET_COMPONENT`.
- Exemplo PDV: `widgets/pdv/pdv/pdv.widget.ts`.

## Barras e Janelas

- `core/services/ui.service.ts`: controla estado das barras, overlay e ferramenta ativa do painel direito.
- `features/shell/left-bar/*`: menu de serviços (usa `shared/components/left-bar-icon-buttons`).
- `features/shell/right-bar/*`: painel com ferramentas (logger/to‑do/notas).
- `core/services/windows.service.ts`: abrir/focar/minimizar janelas de widgets.

## Helper e Acessibilidade

- `core/services/helper.service.ts`: cria uma bolha de dica que lê `data-help`, `aria-label` ou `title` do elemento em foco/hover.
- Itens do catálogo e botões relevantes expõem dicas dinâmicas usando o nome do app/serviço.

## Widget PDV

- Estado: `widgets/pdv/core/pdv-state.service.ts`
  - Signals para cliente/itens/descontos/forma de pagamento/totais.
  - `limpar()` reseta tudo e deixa “Cliente anônimo” desmarcado (próximo atendimento começa identificado).
- Cliente (topo): `widgets/pdv/toppdv/*`
  - Campos com autocomplete (`widgets/pdv/ui/autocomplete-input/*`).
  - Sugestões por nome/email/telefone/documento em ordem alfabética.
  - Ao selecionar uma sugestão, preenche todos os dados e associa o `id` do cliente ao estado.
- Pagamento/total (direita): `widgets/pdv/rightpdv2/*`
  - Define forma de pagamento, parcelas, descontos; confirma/cancela compra e gerencia histórico/impresso.
  - Após confirmar/cancelar, sincroniza UI (parcelas, desconto, forma) e limpa os inputs.

### Anti‑Duplicação e Enriquecimento de Cliente

- Serviço de busca: `widgets/pdv/core/clientes.service.ts`
  - `searchFull(field, q)`: traz lista de clientes completos e filtra pelo campo digitado.
- Backend de clientes: `api/src/routes/clients.js`
  - `POST /clients`: UPSERT — procura por `document`, `email` (case‑insensitive) ou `phone`. Se existir, mescla só os campos informados; se não, cria.
  - `PUT /clients/:id`: merge explícito do cliente por id.
  - Índices únicos no schema: `clients(document)`, `clients(email)`, `clients(phone)`.
- Na confirmação de compra:
  - Se o cliente tem `id`, fazemos `PUT` para mesclar novos dados (ex.: adicionar email). O estado é sincronizado com o retorno.
  - Sem `id`, o sistema tenta localizar por doc/email/telefone e faz `PUT` ou `POST` (com UPSERT) evitando duplicar.

## Endpoints (resumo)

- Auth: `POST /auth/login`, `GET /me` (JWT).
- Products: `GET /products`, `POST /products` (auth).
- Clients: `GET /clients?query&limit`, `POST /clients` (auth, UPSERT), `PUT /clients/:id` (auth, merge).
- Orders: `POST /orders` (cria + calcula totais), `GET /orders`, `GET /orders/:id`, `DELETE /orders/:id`.

## Scripts Úteis (API)

- `npm run seed` — popula dados de exemplo.
- `npm run dev` — inicia servidor Express.
- `npm run start` — inicia servidor Express.
- `npm run reset:clients` — apaga todos os registros em `clients` (mantém pedidos/produtos).

## Dicas/Problemas Comuns

- “Losango com ?”/acentos quebrados: os templates foram normalizados para UTF‑8. Se editar em outro editor, garanta UTF‑8 sem BOM.
- Variáveis de ambiente: ajuste `API_BASE_URL` no front e `PORT/JWT_SECRET/DB_PATH` na API conforme necessário.

## Roadmap (sugestões)

- Persistir e sincronizar logger/to‑do/notas no backend.
- i18n e preferências de acessibilidade adicionais.
- Testes E2E para o fluxo do PDV.

---
Qualquer dúvida ou melhoria que queira, abra uma issue ou peça aqui que eu ajusto.
