# Review Games — AI & Engineering Guide (CLAUDE.md)

Este documento define a arquitetura, convenções, comandos de execução e regras operacionais para qualquer desenvolvedor ou agente de IA atuando no repositório **Review Games**.

---

## 🚀 Comandos Rápidos

### Backend (`/backend`)
```bash
cd backend
npm install
npm run dev      # Inicia via nodemon na porta 3000
npm start        # Inicia via node server.js na porta 3000
```

### Frontend (`/frontend`)
```bash
cd frontend
npm install
npm run dev      # Inicia Vite dev server em http://localhost:5173 (host 0.0.0.0)
npm run build    # Build de produção
npm run preview  # Preview do build de produção
npm run lint     # Executa ESLint 9
```

### Docker Compose (Raiz)
```bash
docker-compose up --build
```

---

## 🏗️ Arquitetura do Repositório

```
Review-Games/
├── .github/workflows/node.yml    # Pipeline CI/CD (GitHub Actions)
├── agents/                       # Definições de subagentes especializados
│   └── review-games-lead.md     # Agente mestre de arquitetura e design
├── backend/                      # API Node.js / Express
│   ├── server.js                # Ponto de entrada da API e rotas
│   ├── vercel.json              # Configuração Serverless Vercel
│   ├── dockerfile               # Container Node do backend
│   └── package.json             # Dependências e scripts do servidor
├── frontend/                     # SPA React 19 + Vite 7 + Tailwind CSS v4
│   ├── src/
│   │   ├── main.jsx             # Montagem do React (StrictMode)
│   │   ├── App.jsx              # Componente principal de busca e exibição
│   │   ├── App.css              # Estilos específicos da aplicação
│   │   └── index.css            # Estilos globais e tokens Tailwind
│   ├── index.html               # Documento HTML base e tags SEO
│   ├── vite.config.js           # Configurações do bundler Vite
│   └── package.json             # Dependências React e Tailwind
├── docker-compose.yml            # Orquestração local de frontend e backend
└── README.md                     # Documentação geral do projeto
```

---

## 📐 Regras e Skills Obrigatórias

### 1. Design & UI Polish
* **Emil Kowalski (`/emil-design-eng`)**:
  - Feedback tátil em todos os botões: `:active` com `transform: scale(0.97)` e transição ágil (`160ms cubic-bezier(0.23, 1, 0.32, 1)`).
  - Nunca iniciar animação de entrada com `scale(0)` (utilizar `scale(0.95)` + `opacity: 0`).
  - Proibido `ease-in` em componentes de interface; utilizar sempre `ease-out` ou curvas físicas de mola (`spring`).
  - Duração de animações de microinteração sempre menor que 300ms.
* **Anti-Slop & Editorial (`/design-taste-frontend`, /gpt-taste`, `/high-end-visual-design`)**:
  - Eliminar o clichê "AI Purple / Neon Glow" genérico. Utilizar bases neutras profundas (`zinc-950`, `slate-950`) com acentos precisos de alto contraste.
  - Layouts de Bento Grid dinâmicos e com proporções rítmicas; proibir repetição monótona de 3 cards brancos idênticos.
  - Proibido renderizar 20 `<iframe>` do YouTube simultaneamente. Exibir cards com thumbnail, título e acionar player em modal sob demanda.
  - Altura do viewport estável com `min-h-[100dvh]` para evitar pulos de layout em navegadores mobile.
* **Acessibilidade (`/accessibility-review`)**:
  - Padrão WCAG 2.1 AA em todo o projeto.
  - Contraste de cor mínimo de 4.5:1 para textos normais e 3:1 para títulos grandes.
  - Labels semânticos explícitos em inputs de busca e anéis de foco (`:focus-visible`) visíveis e customizados.
  - Respeitar `@media (prefers-reduced-motion: reduce)`.

### 2. SEO & Posicionamento (`/seo-audit`, `/competitive-brief`)
- `<title>` descritivo e contextual para cada jogo.
- Meta tags de OpenGraph (`og:title`, `og:image`, `og:description`, `og:url`) e Twitter Cards.
- Schema.org JSON-LD para jogos:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "Game Title",
    "image": "https://...",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "bestRating": "5",
      "ratingCount": "1200"
    }
  }
  ```

### 3. Desenvolvimento & Frontend (`/vercel-react-best-practices`, `/vercel-composition-patterns`, `/tdd`, `/debug`, `/webapp-testing`)
- Padrão de Componentes Compostos (Compound Components) para cards, grids e modais.
- Estados de UI completos: Loading (Skeletons elegantes), Empty State ilustrado, Error State amigável com retry.
- Tratamento estrito de exceções em chamadas assíncronas com `try...catch`.
- Testes unitários com Vitest/React Testing Library e testes E2E com Playwright.

### 4. Backend & Banco de Dados (`/architecture`, `/improve-codebase-architecture`)
- **Degradação Graciosa (Graceful Degradation):**
  - RAWG é o provedor principal. Se YouTube ou HuggingFace falharem por timeout ou quota, a rota deve entregar os dados do jogo normalmente com nota da comunidade, em vez de retornar erro 500.
- **Persistência Efetiva:**
  - Registrar logs no MongoDB (`GameLog`) em cada busca válida para fins de auditoria e estatísticas de buscas populares.
- **Estruturação em Camadas:**
  - Separar rotas, controllers e serviços (`services/rawgService.js`, `services/sentimentService.js`, `services/youtubeService.js`).
- **Segurança de API:**
  - Adicionar `express-rate-limit` e `helmet`. Sanitizar queries de entrada.

### 5. Documentação & Conhecimento (`/obsidian-vault`, `/claude-md-improver`, `/find-skills`)
- Registrar decisões arquiteturais (ADRs) na pasta `docs/architecture/` com wikilinks compatíveis com Obsidian.
- Manter o `CLAUDE.md` sincronizado a cada nova dependência ou fluxo adicionado.

### 6. Utilitários (`/caveman`, `/caveman-commit`, `/caveman-review`)
- Reviews técnicos objetivos no formato:
  `L<linha>: 🔴 bug | 🟡 risk | 🔵 nit: <problema>. <correção>.`
- Commits convencionais concisos: `<tipo>(<escopo>): <descrição no imperativo>`.

---

## ⚠️ Armadilhas e Gotchas Conhecidos

1. **Porta do Backend**: No Docker e localmente, certifique-se de que `app.listen(PORT)` está ativo (não comentado) em ambientes não-serverless.
2. **Quotas da API do YouTube**: Cada busca consome 100 unidades da cota diária (limite de 10.000 unidades/dia). Trate quotas excedidas como aviso silencioso e retorne array vazio de vídeos, nunca quebrando a resposta da API.
3. **Tailwind v4 com Vite**: No Tailwind CSS v4, certifique-se de que `@tailwindcss/vite` está registrado no `vite.config.js` e `@import "tailwindcss";` está presente no topo de `index.css`.
4. **CI GitHub Actions**: A raiz não possui `package.json`. O workflow deve navegar explicitamente para `backend` e `frontend` para executar `npm ci` e testes.
