<div align="center">

# 💸 VibeFinance

### Dashboard de Finanças Pessoais com estética **High-End Tech**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?style=flat-square&logo=framer)](https://www.framer.com/motion)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)

🌐 **[Acesse ao vivo → projeto-financas-dark-updated.vercel.app](https://projeto-financas-dark-updated.vercel.app)**

</div>

---

## 📌 Sobre o Projeto

O **VibeFinance** é uma aplicação completa de finanças pessoais com Landing Page, dashboard e suporte a PWA offline-first. Construída do zero com foco em estética dark de alto nível, UX fluida e dados reais via Supabase. Conecte contas bancárias simuladas, acompanhe transações, parcelamentos, assinaturas, metas financeiras e muito mais — tudo com animações suaves e interface responsiva do mobile ao desktop.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend Framework | React | 19 |
| Build Tool | Vite | 8 |
| Estilização | Tailwind CSS | 3 |
| Animações | Framer Motion | 12 |
| Ícones | Lucide React | 1.14 |
| Gráficos | Recharts | 3 |
| Backend / Auth / DB | Supabase (`@supabase/supabase-js`) | 2 |
| Exportação PDF | jsPDF + jspdf-autotable | 4 / 5 |
| Animação de conquista | canvas-confetti | 1.9 |
| Utilitários CSS | clsx + tailwind-merge | – |
| Deploy & CI/CD | Vercel | – |

---

## ✨ Funcionalidades

### ✅ Implementadas

**Landing Page**
- [x] Página de apresentação completa com 7 seções: Nav, Hero, Ticker, Features, Stats, CTA e Footer
- [x] Navegação fixa com scroll suave entre seções e menu hamburger no mobile
- [x] Hero com 3 phone mockups interativos animados (float + hover com glow e scale via Framer Motion)
- [x] Ticker de marquee com destaques do produto em loop contínuo
- [x] Grid de 6 feature cards com efeitos hover (beam, corner-accent, border-accent)
- [x] Seção de stats com números em gradiente e tipografia Manrope 900
- [x] CTA final com gradiente radial accent e badges de App Store / Google Play
- [x] Fluxo de autenticação diferenciado: "Entrar" → login, "Começar Grátis" → cadastro
- [x] Botão "Voltar ao início" na tela de login para retornar à landing page

**PWA — Offline-First**
- [x] `manifest.json` completo: nome, cores, ícones PNG 192×512, screenshot, shortcut
- [x] Ícones PNG gerados em 192×192 e 512×512 (fundo #000000, accent #ef233c)
- [x] Service worker com cache em duas camadas (static + runtime)
- [x] Estratégia stale-while-revalidate para assets — responde do cache e atualiza em background
- [x] Network-first para navegação com fallback offline para o shell em cache
- [x] Cache-first para fontes do Google (estáveis, não precisam de rede)
- [x] Supabase e APIs externas bypassados (sempre dados frescos)
- [x] `browserconfig.xml` para tiles do Windows
- [x] App instalável via browser no Android (Chrome) e iOS (Safari)

**Autenticação**
- [x] Login e cadastro via Supabase Auth (e-mail + senha)
- [x] Checkbox "Lembrar de mim" na tela de login
- [x] Fluxo completo de "Esqueceu a senha" com redefinição por e-mail (PKCE flow)
- [x] **Modo Demonstração sem login** — explore todas as funcionalidades sem criar conta
- [x] Banner de aviso no modo demo com botão de cadastro rápido
- [x] Onboarding pós-cadastro: questionário em 3 etapas para personalizar o perfil financeiro
- [x] Guard no Supabase client: app carrega mesmo sem variáveis de ambiente configuradas

**Dashboard**
- [x] 6 abas: Visão Geral, Transações, Parcelamentos, Assinaturas, Categorias e Bancos
- [x] Visão Geral com saldo total, KPIs animados e gráfico mensal de receitas × despesas
- [x] Regra 50/30/20 com barras coloridas distintas (necessidades / desejos / investimentos)
- [x] Cards de KPI: total em assinaturas/mês, parcelas ativas e saldo nos bancos conectados
- [x] Gráfico de barras empilhadas de gastos mensais (6 meses)
- [x] Card de reserva de emergência com cálculo automático baseado nos gastos reais
- [x] Notificações in-app de vencimentos e limites de categoria

**Limites de Gastos**
- [x] Definição de limite mensal por categoria
- [x] Alertas visuais ao aproximar e ultrapassar o limite definido
- [x] Integração com o dashboard e a aba de categorias

**Bancos & Seed de Dados**
- [x] Integração simulada com 8 bancos brasileiros: Nubank, Inter, Itaú, Bradesco, C6, PicPay, Santander e Caixa
- [x] Ao conectar um banco, popula automaticamente 20 transações, 3 parcelamentos e 1 assinatura realistas
- [x] Ao desconectar, remove todos os dados vinculados ao banco (campo `bank_source`)
- [x] Saldo mock gerado por faixa realista de cada instituição

**Transações**
- [x] Listagem com busca, filtro por categoria e tipo (receita / despesa)
- [x] Cadastro manual com nome, valor, data e categoria
- [x] Exclusão individual
- [x] **Exportação do extrato mensal em PDF** com sumário financeiro e tabela de transações

**Parcelamentos**
- [x] Lista de compras parceladas com barra de progresso visual
- [x] Cadastro de novos parcelamentos (nome, valor total, nº de parcelas, data de início)
- [x] Acompanhamento mensal com data de término e alerta de quitação
- [x] Animação de parabéns com confete ao quitar um parcelamento 🎉
- [x] Exclusão com confirmação

**Assinaturas**
- [x] Gestão de serviços recorrentes com ciclo mensal
- [x] Total mensal consolidado em assinaturas
- [x] Próxima data de cobrança por serviço

**Categorias**
- [x] Gráfico de pizza com breakdown de gastos por categoria (Recharts)
- [x] Comparativo de receitas × despesas por categoria
- [x] Assinaturas e parcelamentos visíveis dentro das categorias com tags visuais

**Metas Financeiras**
- [x] Criação de metas com nome, valor alvo, prazo, categoria e cor personalizada
- [x] Barra de progresso com % concluída e dias restantes
- [x] Fluxo de conquista: confete + modal celebrativo ao atingir 100% 🎉
- [x] Edição e exclusão de metas

**Perfil & Configurações**
- [x] Edição de nome, e-mail e WhatsApp com seletor de código de país (10 países)
- [x] Troca de senha com reautenticação e validação em tempo real
- [x] Exclusão permanente de conta com modal de confirmação dupla
- [x] Preferências de tema: Dark / Light / Automático (segue o SO)

**Suporte**
- [x] Chat de suporte com IA via Edge Function do Supabase
- [x] Formulário de reporte de problemas com 7 categorias, salvo no banco de dados

**Layout & UX**
- [x] Sidebar fixa no desktop + Bottom Navigation no mobile
- [x] Animações de página e troca de aba com Framer Motion
- [x] CI/CD automático: cada `git push` dispara deploy na Vercel
- [x] Content Security Policy configurada via `vercel.json`

### 🔧 Próximas Etapas

- [ ] Integração real com Open Finance (Pluggy / Belvo)
- [ ] Relatório anual em PDF (12 meses consolidados)
- [ ] App mobile nativo (React Native / Expo)

---

## 🌐 Landing Page

A landing page serve como porta de entrada pública do produto, apresentando as funcionalidades, métricas e CTAs de conversão.

| Seção | Descrição |
|---|---|
| **Nav** | Fixa com scroll detection, links com scroll suave, hamburger mobile |
| **Hero** | Título + 3 phone mockups com float e hover interativo (Framer Motion) |
| **Ticker** | Marquee 35s com destaques do produto em loop |
| **Features** | Grid de 6 cards com efeitos hover (beam, corner-accent, border accent) |
| **Stats** | 4 métricas com gradiente `from-accent to-gray-200` e font clamp |
| **CTA** | Radial gradient accent, botão principal e badges de loja |
| **Footer** | 4 colunas de links + copyright dinâmico |

---

## 📱 PWA — Progressive Web App

O VibeFinance pode ser instalado como app nativo em qualquer dispositivo.

**Como instalar:**
- **Android (Chrome):** abra o site → banner "Adicionar à tela inicial" ou menu (⋮) → Instalar app
- **iPhone (Safari):** abra o site → botão compartilhar → "Adicionar à Tela de Início"

**Estratégias de cache do Service Worker:**

| Tipo de requisição | Estratégia |
|---|---|
| Navegação (HTML) | Network-first → fallback offline |
| Assets (JS/CSS/img) | Stale-while-revalidate |
| Google Fonts | Cache-first |
| Supabase / APIs externas | Bypass (sempre online) |

**Regenerar ícones:**
```bash
node scripts/generate-icons.mjs
```

---

## 🎭 Modo Demonstração

O VibeFinance possui um **modo demo** acessível diretamente na tela de login — nenhum cadastro necessário.

Ao entrar no modo demo:
- Um conjunto completo de dados fictícios é carregado (transações, metas, assinaturas, parcelamentos e bancos conectados)
- Todas as telas ficam disponíveis para exploração
- Ações de escrita (adicionar, excluir, editar) exibem um modal convidando o usuário a criar uma conta real
- Um banner fixo indica que o modo demo está ativo
- Sair do demo retorna para a landing page sem deixar rastros

---

## 🗄️ Banco de Dados (Supabase / PostgreSQL)

Todas as tabelas possuem **Row Level Security (RLS)** ativa — cada usuário acessa apenas seus próprios dados.

| Tabela | Campos principais | RLS |
|---|---|---|
| `transactions` | id, user_id, title, amount, category, type, date, bank_source | ✅ |
| `installments` | id, user_id, name, total_amount, installment_amount, total_installments, paid_installments | ✅ |
| `subscriptions` | id, user_id, name, amount, billing_cycle, next_billing_date, bank_source | ✅ |
| `goals` | id, user_id, name, target_amount, current_amount, deadline, color, category | ✅ |
| `profiles` | id, full_name, birth_date, whatsapp | ✅ |
| `support_tickets` | id, user_id, category, description, created_at | ✅ |
| `user_onboarding` | id, user_id, monthly_salary, financial_goal, preferred_categories, completed_at | ✅ |

---

## 🎨 Design System

| Token | Valor |
|---|---|
| Background | `#000000` — Pure Black |
| Surface | `#18181b` — Zinc 900 |
| Borda | `#27272a` — Zinc 800 |
| Accent | `#ef233c` — Electric Red |
| Texto primário | `#ffffff` (dark) / `#111827` (light) |
| Texto secundário | `gray-200` / `#71717a` |
| Fonte de títulos | **Manrope** (Google Fonts) |
| Fonte de corpo | **Inter** (Google Fonts) |
| Efeitos | `border-spin-gradient`, `hover-shimmer`, `hover-beam`, `corner-accent`, `btn-connect`, `dashed-container` |
| Animações | `fade-in-slide`, `column-reveal`, `float`, `marquee` |
| Temas | Dark / Light / Automático (`prefers-color-scheme`) |

---

## 💻 Como Rodar Localmente

**Pré-requisitos:** Node.js 18+

```bash
# 1. Clone o repositório
git clone https://github.com/Gaveta-cmd/projeto-financas-dark.git
cd projeto-financas-dark

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (opcional — sem elas só o modo demo funciona)
# Crie um arquivo .env na raiz com:
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon

# 4. Rode em modo desenvolvimento
npm run dev
```

> 💡 **Dica:** Prefere explorar sem configurar nada? A landing page carrega normalmente e o botão **"Explorar sem cadastro"** dá acesso ao modo demo completo.

### Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento (http://localhost:5173)
npm run build    # Build de produção
npm run preview  # Preview do build local
npm run lint     # Lint com ESLint
node scripts/generate-icons.mjs  # Regera ícones PWA em PNG
```

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── landing/
│   │   ├── LandingNav.jsx        # Navegação fixa com scroll suave
│   │   ├── LandingHero.jsx       # Hero com phone mockups animados
│   │   ├── LandingTicker.jsx     # Marquee de destaques do produto
│   │   ├── LandingFeatures.jsx   # Grid de 6 feature cards
│   │   ├── LandingStats.jsx      # Métricas com gradient text
│   │   ├── LandingCTA.jsx        # CTA final com badges de loja
│   │   └── LandingFooter.jsx     # Footer com 4 colunas
│   ├── dashboard/
│   │   ├── OverviewTab.jsx       # Visão geral com KPIs e regra 50/30/20
│   │   ├── CategoriesTab.jsx     # Gráfico de pizza por categoria
│   │   ├── InstallmentsTab.jsx   # Parcelamentos com progresso visual
│   │   ├── SubscriptionsTab.jsx  # Assinaturas recorrentes
│   │   └── DashboardTabs.jsx     # Navegação entre abas
│   ├── ConnectedAccounts.jsx     # Integração com 8 bancos brasileiros
│   ├── Transactions.jsx          # Listagem, cadastro e exportação PDF
│   ├── Goals.jsx                 # Metas financeiras com fluxo de conquista
│   ├── OnboardingModal.jsx       # Questionário pós-cadastro em 3 etapas
│   ├── EmergencyReserveModal.jsx # Cálculo de reserva de emergência
│   ├── SupportChat.jsx           # Chat com IA via Edge Function
│   ├── Login.jsx                 # Auth com modo signin/signup/forgot
│   ├── Profile.jsx               # Perfil e edição de dados
│   ├── Preferences.jsx           # Tema e preferências
│   ├── DemoBanner.jsx            # Banner do modo demonstração
│   └── DemoBlockModal.jsx        # Modal de bloqueio no demo
├── pages/
│   └── LandingPage.jsx           # Assembler da landing page
├── contexts/
│   └── DemoContext.jsx           # Gerenciamento global do modo demo
├── hooks/
│   ├── useOnboarding.js          # Questionário pós-cadastro
│   ├── useEmergencyReserve.js    # Cálculo de reserva de emergência
│   ├── useSpendingLimits.js      # Limites de gastos por categoria
│   └── useUpcomingNotifications.js # Notificações de vencimentos
├── data/
│   └── demoData.js               # Dados fictícios para o modo demo
├── lib/
│   ├── bankSeed.js               # Seed e limpeza de dados por banco
│   ├── pdfExport.js              # Geração de relatório PDF (jsPDF)
│   ├── supabaseClient.js         # Cliente Supabase com guard de env vars
│   └── utils.js                  # Funções utilitárias (cn)
├── scripts/
│   └── generate-icons.mjs        # Geração de ícones PWA em PNG via sharp
└── App.jsx                       # Roteamento principal e estado global
```

---

## 👤 Autor

**Davi Augusto**

[![GitHub](https://img.shields.io/badge/GitHub-Gaveta--cmd-181717?style=flat-square&logo=github)](https://github.com/Gaveta-cmd)

---

<div align="center">
  <sub>Feito com 💸 e muito café</sub>
</div>
