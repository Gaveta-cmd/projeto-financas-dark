<div align="center">

# 💸 VibeFinance

### Gestão financeira da família, rodando em casa

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-25-ED8B00?style=flat-square&logo=openjdk)](https://openjdk.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-instalável-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps)

</div>

---

## 📌 Sobre o projeto

**VibeFinance** é um app de finanças domésticas: cada morador tem sua conta, todos entram no
mesmo grupo familiar e acompanham juntos despesas, receitas, cartões, parcelamentos,
assinaturas e metas.

Tudo roda na sua própria máquina — site, API e banco de dados. Nenhum dado sai de casa.

---

## ✨ Funcionalidades

- **Casa:** grupo familiar com código de convite, renda por membro e visão por pessoa ou da casa toda
- **Visão geral:** renda, despesas e sobra do mês, radar de orçamento e próximos vencimentos
- **Transações:** cadastro manual, busca e filtros por categoria e tipo
- **Cartões:** crédito, débito ou híbrido, com uso do limite no mês
- **Parcelamentos e assinaturas:** progresso das parcelas e datas de cobrança
- **Categorias e limites:** gastos por categoria com limite pessoal ou da casa
- **Simulador e planejamento:** estimativas do mês e divisão da renda entre essenciais, qualidade de vida e futuro
- **Metas:** objetivos com prazo, aportes e reserva de emergência
- **Relatórios em PDF:** extrato mensal e relatório anual
- **Temas:** escuro, claro ou automático
- **PWA:** instalável no celular e no computador

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| **Site** | React 19, Vite 8, Tailwind CSS 3, Framer Motion, Recharts |
| **API** | Spring Boot 4 (Java 25), Spring Security, JDBC, Flyway |
| **Banco** | MySQL 8.4 (Docker) |
| **PDF** | jsPDF + jspdf-autotable |
| **Testes** | Vitest + Testing Library |

---

## 💻 Como rodar

O passo a passo completo — banco, API, site, acesso pelo celular e backup — está em
**[COMO_RODAR.md](COMO_RODAR.md)**. Em resumo:

```bash
cp .env.example .env          # troque as senhas
docker compose up -d          # MySQL
cd backend && ./mvnw spring-boot:run   # API em :8080 (com as variáveis do .env no ambiente)
npm install && npm run dev    # site em :5173
```

**Pré-requisitos:** Node.js 20+, Java 25 e Docker.

### Scripts do site

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
npm run lint     # ESLint
npm test         # testes
```

---

## 📁 Estrutura

```
backend/                       # API Spring Boot
└── src/main/
    ├── java/com/vibefinance/api/
    │   ├── auth/              # cadastro, login e sessão
    │   ├── data/              # consultas e regras de acesso por tabela
    │   ├── rpc/               # entrar na casa por convite, excluir conta
    │   ├── security/          # filtro de token e configuração
    │   └── common/            # erros da API
    └── resources/db/migration # schema MySQL (Flyway)

src/                           # site React
├── components/
│   ├── dashboard/             # abas do painel
│   ├── Goals.jsx              # metas
│   ├── Transactions.jsx       # transações
│   └── Profile.jsx            # perfil
├── contexts/                  # grupo familiar
├── hooks/                     # cartões, limites, estimativas, notificações
└── lib/
    ├── api.js                 # cliente da API
    └── pdfExport.js           # geração de PDFs

docker-compose.yml             # MySQL local
```

---

## 🗄️ Banco de dados

O schema é criado pela API na primeira execução (`backend/src/main/resources/db/migration`).

| Tabela | Descrição |
|---|---|
| `users`, `auth_sessions` | Contas e sessões de login |
| `profiles` | Nome, nascimento e contato |
| `households`, `household_members` | Grupo familiar e seus membros |
| `cards` | Cartões da casa |
| `transactions` | Receitas e despesas |
| `installments`, `subscriptions` | Parcelamentos e assinaturas |
| `goals` | Metas financeiras |
| `spending_limits`, `budget_estimates` | Limites por categoria e estimativas do mês |

---

## 🔐 Segurança

- Senhas guardadas com bcrypt; o banco guarda só o hash do token de sessão
- Regras de acesso aplicadas no servidor: cada pessoa altera apenas o que é seu e só enxerga
  os dados compartilhados da própria casa
- Entrada em uma casa apenas com o código de convite
- Cadastro de novas contas pode ser desligado (`SIGNUP_ENABLED=false`)
- O MySQL só aceita conexões da própria máquina

---

## 🎨 Design system

| Token | Valor | Uso |
|---|---|---|
| **Background** | `#000000` | Fundo principal |
| **Surface** | `#18181b` | Cards e superfícies |
| **Border** | `#27272a` | Divisórias |
| **Accent** | `#ef233c` | Botões e destaques |
| **Títulos** | Manrope | |
| **Corpo** | Inter | |

---

## 👤 Autor

**Davi Augusto**

[![GitHub](https://img.shields.io/badge/GitHub-Gaveta--cmd-181717?style=flat-square&logo=github)](https://github.com/Gaveta-cmd)
[![Email](https://img.shields.io/badge/Email-dabrss06@gmail.com-EA4335?style=flat-square&logo=gmail)](mailto:dabrss06@gmail.com)
