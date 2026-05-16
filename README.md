<div align="center">

# 💸 VibeFinance

### Dashboard de Finanças Pessoais com estética **High-End Tech**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)

🌐 **[Acesse ao vivo → projeto-financas-dark.vercel.app](https://projeto-financas-dark.vercel.app)**

</div>

---

## 📌 Sobre o Projeto

O **VibeFinance** é um dashboard de finanças pessoais construído do zero, com foco em estética dark de alto nível, UX fluida e dados reais via Supabase. Conecte contas bancárias simuladas, acompanhe transações, parcelamentos, assinaturas, metas financeiras e muito mais — tudo com animações suaves e uma interface responsiva que funciona do mobile ao desktop.

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

**Autenticação**
- [x] Login e cadastro via Supabase Auth (e-mail + senha)
- [x] Checkbox "Lembrar de mim" na tela de login
- [x] Fluxo completo de "Esqueceu a senha" com redefinição por e-mail (PKCE flow)
- [x] **Modo Demonstração sem login** — explore todas as funcionalidades sem criar conta
- [x] Banner de aviso no modo demo com botão de cadastro rápido

**Dashboard**
- [x] 6 abas: Visão Geral, Transações, Parcelamentos, Assinaturas, Categorias e Bancos
- [x] Visão Geral com saldo total, KPIs animados e gráfico mensal de receitas × despesas
- [x] Regra 50/30/20 com barras coloridas distintas (necessidades / desejos / investimentos)
- [x] Cards de KPI: total em assinaturas/mês, parcelas ativas e saldo nos bancos conectados
- [x] Gráfico de barras empilhadas de gastos mensais (6 meses)

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

### 🔧 Pendentes / Próximas Etapas

- [ ] Landing page de apresentação do produto
- [ ] Integração real com Open Finance (Pluggy / Belvo)
- [ ] Notificações de vencimento de parcelas e assinaturas
- [ ] Limites de gastos por categoria com alertas inteligentes
- [ ] Questionário pós-cadastro para personalizar a experiência
- [ ] App mobile nativo (React Native / Expo)
- [ ] Modo PWA (instalação via browser)

---

## 🎭 Modo Demonstração

O VibeFinance possui um **modo demo** acessível diretamente na tela de login — nenhum cadastro necessário.

Ao entrar no modo demo:
- Um conjunto completo de dados fictícios é carregado (transações, metas, assinaturas, parcelamentos e bancos conectados)
- Todas as telas ficam disponíveis para exploração
- Ações de escrita (adicionar, excluir, editar) exibem um modal convidando o usuário a criar uma conta real
- Um banner fixo indica que o modo demo está ativo
- Sair do demo retorna para a tela de login sem deixar rastros

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

> **Campo `bank_source`**: presente em `transactions`, `installments` e `subscriptions`. Armazena o `id` do banco que gerou os dados de seed, permitindo limpeza precisa ao desconectar.

---

## 🎨 Design System

| Token | Valor |
|---|---|
| Background | `#0f0f0f` — Deep Black |
| Surface | `#18181b` — Zinc 900 |
| Borda | `rgba(255,255,255,0.08)` |
| Accent | `#ef233c` — Electric Red |
| Texto primário | `#ffffff` (dark) / `#111827` (light) |
| Texto secundário | `#71717a` — Zinc 500 |
| Fonte de títulos | **Manrope** (Google Fonts) |
| Fonte de corpo | **Inter** (Google Fonts) |
| Animações | `fadeSlideIn`, `columnReveal`, `hover-beam`, `border-spin-gradient` |
| Temas | Dark / Light / Automático (`prefers-color-scheme`) |

---

## 💻 Como Rodar Localmente

**Pré-requisitos:** Node.js 18+ e uma conta no [Supabase](https://supabase.com)

```bash
# 1. Clone o repositório
git clone https://github.com/Gaveta-cmd/projeto-financas-dark.git
cd projeto-financas-dark

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env na raiz com:
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon

# 4. Rode em modo desenvolvimento
npm run dev
```

> 💡 **Dica:** Prefere explorar sem configurar nada? Clique em **"Entrar no modo demo"** na tela de login.

### Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento (http://localhost:5173)
npm run build    # Build de produção
npm run preview  # Preview do build local
npm run lint     # Lint com ESLint
```

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── dashboard/
│   │   ├── OverviewTab.jsx       # Visão geral com KPIs e regra 50/30/20
│   │   ├── CategoriesTab.jsx     # Gráfico de pizza por categoria
│   │   ├── InstallmentsTab.jsx   # Parcelamentos com progresso visual
│   │   ├── SubscriptionsTab.jsx  # Assinaturas recorrentes
│   │   └── DashboardTabs.jsx     # Navegação entre abas
│   ├── ConnectedAccounts.jsx     # Integração com 8 bancos brasileiros
│   ├── Transactions.jsx          # Listagem, cadastro e exportação PDF
│   ├── Goals.jsx                 # Metas financeiras com fluxo de conquista
│   ├── SupportChat.jsx           # Chat com IA via Edge Function
│   ├── Profile.jsx               # Perfil e edição de dados
│   ├── Preferences.jsx           # Tema e preferências
│   ├── DemoBanner.jsx            # Banner do modo demonstração
│   └── DemoBlockModal.jsx        # Modal de bloqueio de ações no demo
├── contexts/
│   └── DemoContext.jsx           # Gerenciamento global do modo demo
├── data/
│   └── demoData.js               # Dados fictícios pré-carregados para o demo
├── lib/
│   ├── bankSeed.js               # Seed e limpeza de dados por banco conectado
│   ├── pdfExport.js              # Geração de relatório PDF mensal (jsPDF)
│   ├── supabaseClient.js         # Instância configurada do cliente Supabase
│   └── utils.js                  # Funções utilitárias
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
