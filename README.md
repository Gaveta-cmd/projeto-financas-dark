<div align="center">

# ðŸ’¸ VibeFinance

### AplicaÃ§Ã£o de GestÃ£o Financeira Pessoal com Interface Dark de Alto NÃ­vel

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)

ðŸŒ **[Acessar ao vivo â†’](https://projeto-financas-dark.vercel.app)**

</div>

---

## ðŸ“‘ Ãndice

- [Sobre](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Stack TecnolÃ³gico](#-stack-tecnolÃ³gico)
- [Como Rodar](#-como-rodar-localmente)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [PWA e Offline](#-pwa--progressive-web-app)
- [Banco de Dados](#-banco-de-dados-supabase--postgresql)
- [Design System](#-design-system)
- [Autor](#-autor)

---

## ðŸ“Œ Sobre o Projeto

**VibeFinance** Ã© uma plataforma moderna de finanÃ§as pessoais desenvolvida do zero com foco em **estÃ©tica dark premium**, **UX intuitiva** e **funcionalidades educacionais**.

Controle suas despesas, receitas, metas financeiras e integre seus bancos tudo em um Ãºnico lugar. A aplicaÃ§Ã£o funciona **100% offline** (PWA) e oferece um **modo demo** para explorar sem criar conta.

**Destaques:**
âœ… Dashboard com KPIs animados e grÃ¡ficos em tempo real  
âœ… Rastreamento de transaÃ§Ãµes, parcelamentos e assinaturas  
âœ… IntegraÃ§Ã£o simulada com 8 bancos brasileiros  
âœ… Metas financeiras com celebraÃ§Ã£o ao atingir 100%  
âœ… ExportaÃ§Ã£o de extratos em PDF  
âœ… Funciona offline via PWA  
âœ… Modo demo sem cadastro obrigatÃ³rio  
âœ… AutenticaÃ§Ã£o segura via Supabase  

---

## âœ¨ Funcionalidades

### ðŸŽ¯ Dashboard
- VisÃ£o geral com saldo total e KPIs
- GrÃ¡fico mensal de receitas vs despesas
- Regra 50/30/20 com visualizaÃ§Ã£o de alocaÃ§Ã£o de renda
- 6 abas: VisÃ£o Geral, TransaÃ§Ãµes, Parcelamentos, Assinaturas, Categorias e Bancos
- NotificaÃ§Ãµes de vencimentos e limites de categoria

### ðŸ’° GestÃ£o Financeira
- **TransaÃ§Ãµes:** Registro manual, busca, filtro por categoria e tipo
- **Parcelamentos:** Controle de compras parceladas com barra de progresso
- **Assinaturas:** GestÃ£o de serviÃ§os recorrentes com data de cobranÃ§a
- **Categorias:** Breakdown de gastos com grÃ¡fico de pizza (Recharts)
- **Metas:** Criar metas com prazo, acompanhar progresso e celebrar conquistas ðŸŽ‰

### ðŸ¦ Bancos & Dados
- IntegraÃ§Ã£o simulada com 8 bancos brasileiros (Nubank, Inter, ItaÃº, etc.)
- Seed automÃ¡tico de dados realistas ao conectar instituiÃ§Ãµes
- Saldo mock por faixa realista de cada banco
- DesconexÃ£o limpa com remoÃ§Ã£o de dados

### ðŸŽ¤ Extras
- **Chat com IA:** Suporte integrado via Edge Function do Supabase
- **Perfil & ConfiguraÃ§Ãµes:** EdiÃ§Ã£o de dados, troca de senha, escolha de tema
- **ExportaÃ§Ã£o PDF:** Extratos mensais com sumÃ¡rio financeiro
- **Modo Demo:** Explore tudo sem criar conta
- **Temas:** Dark / Light / AutomÃ¡tico (segue o SO)

### ðŸ“± PWA
- InstalÃ¡vel como app nativo (Android + iPhone)
- Funciona 100% offline
- AtualizaÃ§Ãµes automÃ¡ticas em background
- Ãcones e splash screens personalizados

---

## ðŸ› ï¸ Stack TecnolÃ³gico

| Camada | Tecnologia | DescriÃ§Ã£o |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Moderna, rÃ¡pida e escalÃ¡vel |
| **Tipagem** | TypeScript 5 | Type-safe em todo o cÃ³digo |
| **EstilizaÃ§Ã£o** | Tailwind CSS 3 | Componentes responsivos e consistentes |
| **AnimaÃ§Ãµes** | Framer Motion 12 | TransiÃ§Ãµes fluidas e interativas |
| **GrÃ¡ficos** | Recharts 3 | VisualizaÃ§Ãµes de dados limpas |
| **Ãcones** | Lucide React 1.14 | Ãcones vetoriais de alta qualidade |
| **Backend** | Supabase | Auth, Database (PostgreSQL) e Edge Functions |
| **PDF** | jsPDF + jspdf-autotable | ExportaÃ§Ã£o de relatÃ³rios |
| **Festas** | canvas-confetti 1.9 | CelebraÃ§Ãµes ao atingir metas |
| **Deploy** | Vercel | CI/CD automÃ¡tico e edge functions |

---

## ðŸ’» Como Rodar Localmente

**PrÃ©-requisitos:** Node.js 18+

### 1ï¸âƒ£ Clone e instale
```bash
git clone https://github.com/Gaveta-cmd/projeto-financas-dark.git
cd projeto-financas-dark
npm install
```

### 2ï¸âƒ£ Configure variÃ¡veis (opcional)
Crie um arquivo `.env` na raiz:
```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

> ðŸ’¡ **Sem variÃ¡veis?** Sem problema! A landing page carrega normal e o **modo demo** funciona 100%.

### 3ï¸âƒ£ Rode em desenvolvimento
```bash
npm run dev
# Abra http://localhost:5173
```

### Scripts disponÃ­veis
```bash
npm run dev      # Servidor com hot reload
npm run build    # Build de produÃ§Ã£o (otimizado)
npm run preview  # Preview local do build
npm run lint     # Verifica cÃ³digo com ESLint
```

---

## ðŸ“ Estrutura do Projeto

```
src/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ landing/              # Landing page (7 seÃ§Ãµes)
â”‚   â”œâ”€â”€ dashboard/            # Abas do dashboard
â”‚   â”œâ”€â”€ Auth/                 # Login, cadastro, recuperaÃ§Ã£o
â”‚   â”œâ”€â”€ Profile.jsx           # EdiÃ§Ã£o de perfil
â”‚   â”œâ”€â”€ Goals.jsx             # Metas financeiras
â”‚   â”œâ”€â”€ Transactions.jsx      # Listagem e cadastro
â”‚   â”œâ”€â”€ ConnectedAccounts.jsx # IntegraÃ§Ã£o bancÃ¡ria
â”‚   â”œâ”€â”€ SupportChat.jsx       # Chat com IA
â”‚   â””â”€â”€ DemoBanner.jsx        # Banner do modo demo
â”‚
â”œâ”€â”€ contexts/
â”‚   â””â”€â”€ DemoContext.jsx       # Estado global do demo
â”‚
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ useOnboarding.js      # QuestionÃ¡rio pÃ³s-cadastro
â”‚   â”œâ”€â”€ useSpendingLimits.js  # Limites por categoria
â”‚   â””â”€â”€ useEmergencyReserve.js
â”‚
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ supabaseClient.js     # Cliente Supabase com RLS
â”‚   â”œâ”€â”€ bankSeed.js           # Seed de dados por banco
â”‚   â””â”€â”€ pdfExport.js          # GeraÃ§Ã£o de PDFs
â”‚
â”œâ”€â”€ data/
â”‚   â””â”€â”€ demoData.js           # Dados fictÃ­cios do demo
â”‚
â””â”€â”€ App.jsx                   # Roteamento principal
```

---

## ðŸ“± PWA â€” Progressive Web App

Instale o VibeFinance como um app nativo no seu dispositivo.

### Como instalar
- **Android (Chrome):** banner "Instalar" ou menu (â‹®) â†’ Instalar app
- **iPhone (Safari):** botÃ£o compartilhar â†’ "Adicionar Ã  Tela de InÃ­cio"
- **Desktop (Chrome/Edge):** menu â†’ "Instalar VibeFinance"

### Funcionalidades offline
- âœ… Funciona 100% sem internet apÃ³s instalaÃ§Ã£o
- âœ… Cache inteligente (stale-while-revalidate)
- âœ… Sincroniza dados ao voltar online
- âœ… Service worker otimizado para performance

---

## ðŸ—„ï¸ Banco de Dados (Supabase / PostgreSQL)

Todas as tabelas usam **Row Level Security (RLS)** â€” cada usuÃ¡rio vÃª apenas seus dados.

| Tabela | DescriÃ§Ã£o | RLS |
|---|---|---|
| `transactions` | TransaÃ§Ãµes de entrada/saÃ­da | âœ… |
| `installments` | Compras parceladas | âœ… |
| `subscriptions` | ServiÃ§os recorrentes | âœ… |
| `goals` | Metas financeiras | âœ… |
| `profiles` | Dados do usuÃ¡rio | âœ… |
| `support_tickets` | Tickets de suporte | âœ… |
| `user_onboarding` | QuestionÃ¡rio inicial | âœ… |

---

## ðŸŽ¨ Design System

| Token | Valor | Uso |
|---|---|---|
| **Background** | `#000000` | Fundo principal (pure black) |
| **Surface** | `#18181b` | Cards e superfÃ­cies |
| **Border** | `#27272a` | DivisÃ³rias e borders |
| **Accent** | `#ef233c` | CTAs e destaque (electric red) |
| **Texto** | `#ffffff` / `#111827` | Dark/light mode |
| **Fonte tÃ­tulos** | Manrope 900 | Bold, impactante |
| **Fonte corpo** | Inter Regular | Limpa, legÃ­vel |

### Efeitos especiais
- `border-spin-gradient` â€” Borda com gradient animado
- `hover-shimmer` â€” Efeito shimmer ao hover
- `corner-accent` â€” Accent nos cantos de cards
- `fade-in-slide` â€” AnimaÃ§Ã£o de entrada suave

---

## ðŸ” SeguranÃ§a

- âœ… AutenticaÃ§Ã£o via Supabase Auth (e-mail + senha)
- âœ… Row Level Security ativo em todas as tabelas
- âœ… Content Security Policy configurada
- âœ… Senhas hashed com bcrypt
- âœ… PKCE flow para recuperaÃ§Ã£o de senha

---

## ðŸš€ PrÃ³ximos Passos

- [ ] IntegraÃ§Ã£o real com Open Finance (Pluggy / Belvo)
- [ ] RelatÃ³rio anual consolidado (12 meses)
- [ ] App mobile nativo (React Native / Expo)
- [ ] Modo de colaboraÃ§Ã£o (contas compartilhadas)
- [ ] IntegraÃ§Ãµes com carteiras cripto

---

## ðŸ“„ LicenÃ§a

Este projeto Ã© open source. Sinta-se Ã  vontade para usar como aprendizado ou base para seus projetos.

---

## ðŸ‘¤ Autor

**Davi Augusto**

[![GitHub](https://img.shields.io/badge/GitHub-Gaveta--cmd-181717?style=flat-square&logo=github)](https://github.com/Gaveta-cmd)
[![Email](https://img.shields.io/badge/Email-dabrss06@gmail.com-EA4335?style=flat-square&logo=gmail)](mailto:dabrss06@gmail.com)

---

<div align="center">
  <p>
    Feito com ðŸ’¸ e muito â˜• para tornar a gestÃ£o financeira mais acessÃ­vel e agradÃ¡vel
  </p>
  <sub>â­ Se esse projeto te ajudou, considere dar uma estrela!</sub>
</div>
