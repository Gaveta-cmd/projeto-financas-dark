# 💰 VibeFinance — Personal Finance Dashboard

> **⚠️ PROJETO EM DESENVOLVIMENTO:** Este sistema está sendo construído ativamente para fins de aprendizado e organização financeira pessoal. Funcionalidades e interface estão em constante evolução.

Um dashboard de finanças pessoais focado em estética **High-End Tech**, com autenticação real, integração a bancos brasileiros, gráficos interativos, modo demonstração sem login e suporte via IA.

🌐 **[Acesse o site ao vivo → projeto-financas-dark.vercel.app](https://projeto-financas-dark.vercel.app)**

---

## 🚀 Status do Projeto

Atualmente em: **Fase de Expansão de Funcionalidades e Integração com Backend**.

---

## 🛠️ Tecnologias Utilizadas

- **React 19** (Vite)
- **Tailwind CSS** (Estilização)
- **Framer Motion** (Animações de interface)
- **Lucide React** (Ícones)
- **Supabase** (Autenticação, Banco de Dados PostgreSQL e Edge Functions)
- **Recharts** (Gráficos interativos)
- **jsPDF + jspdf-autotable** (Exportação de relatórios em PDF)
- **canvas-confetti** (Animações de conquista)
- **Vercel** (Deploy e hospedagem)
- **Git/GitHub** (Versionamento e Backup)

---

## 🎨 Design System & Estética

O projeto segue uma identidade visual rigorosa inspirada no estilo "Linear/Vercel":

- **Background:** `#0f0f0f` (Deep Black)
- **Surfaces:** `#18181b` (Zinc-900) com bordas tracejadas e efeitos de brilho
- **Accents:** `#ef233c` (Electric Red) para destaques e ações principais
- **Tipografia:** `Manrope` (títulos) + `Inter` (corpo) via Google Fonts
- **Animações:** `fadeSlideIn`, `columnReveal`, `border-spin-gradient` e `hover-beam`
- **Temas:** Suporte completo a Dark / Light / Automático (detecta preferência do SO)

---

## 📊 Funcionalidades

### ✅ Implementadas

- [x] Autenticação completa (Sign In / Sign Up) via Supabase Auth
- [x] Checkbox "Lembrar de mim" na tela de login
- [x] Fluxo completo de "Esqueceu a senha" com redefinição por e-mail
- [x] **Modo Demonstração sem login** — explore todas as funcionalidades sem criar conta
- [x] Banner de aviso no modo demo com botão de cadastro rápido
- [x] Dashboard com abas: Visão Geral, Transações, Parcelamentos, Assinaturas, Categorias e Bancos
- [x] Visão Geral com saldo total, KPIs e distribuição de gastos por categoria animada
- [x] Gráfico de barras empilhadas de gastos mensais (6 meses)
- [x] Gráfico de área com evolução do saldo ao longo do tempo
- [x] Integração simulada com 8 bancos brasileiros (Nubank, Inter, Itaú, Bradesco, C6, PicPay, Santander, Caixa)
- [x] Ao conectar um banco, popula automaticamente transações, parcelamentos e assinaturas realistas
- [x] Ao desconectar um banco, remove todos os dados vinculados a ele
- [x] Tela de Transações com cadastro manual, categorização e exclusão
- [x] **Exportação de relatório mensal em PDF** com resumo financeiro e tabela de transações
- [x] Tela de Parcelamentos com progresso visual de cada compra parcelada
- [x] Tela de Assinaturas com serviços recorrentes e total mensal
- [x] Tela de Categorias com gráfico de pizza, breakdown por categoria e comparativo mensal
- [x] Assinaturas e parcelamentos visíveis dentro das categorias com tags visuais
- [x] Acompanhamento mensal de parcelas com data de término e alerta de quitação
- [x] Animação de parabéns com confete ao quitar um parcelamento 🎉
- [x] Tela de Metas Financeiras com progresso visual e fluxo de conquista
- [x] Tela de Cartões com limite, valor usado, barra de uso e alertas de vencimento
- [x] Página de Perfil com edição de nome, e-mail e WhatsApp (seletor de 10 países)
- [x] Troca de senha com reautenticação e validação em tempo real
- [x] Exclusão permanente de conta com modal de confirmação
- [x] Preferências de tema (Dark/Light/Auto) e efeitos sonoros
- [x] Chat de Suporte com IA via Edge Function do Supabase
- [x] Formulário de reportar problemas com 7 categorias e salvamento no banco de dados
- [x] Layout totalmente responsivo (Sidebar no desktop, Bottom Nav no mobile)
- [x] Deploy na Vercel com CI/CD automático a cada push

### 🔧 Em Desenvolvimento

- [ ] Landing page de apresentação do produto
- [ ] Reserva de emergência com cálculo automático por conta
- [ ] Limites de gastos por categoria com detecção inteligente (restaurante, iFood, academia, jogos...)
- [ ] Questionário pós-cadastro para personalizar a experiência do usuário
- [ ] Cálculo inteligente de gastos para montar plano de reserva e investimento
- [ ] Integração real com Open Finance via Pluggy ou Belvo
- [ ] Notificações e alertas de vencimento de parcelas e assinaturas

---

## 💻 Como rodar o projeto localmente

1. Clone o repositório:
```bash
   git clone https://github.com/Gaveta-cmd/projeto-financas-dark.git
   cd projeto-financas-dark
```

2. Instale as dependências:
```bash
   npm install
```

3. Configure as variáveis de ambiente — crie um arquivo `.env` na raiz:
```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. Rode em modo desenvolvimento:
```bash
   npm run dev
```

> 💡 **Dica:** Você também pode explorar o projeto sem configurar nada clicando em **"Explorar sem cadastro"** diretamente no site ao vivo.

---

## 🗄️ Banco de Dados — Tabelas

| Tabela | Campos principais | RLS |
|---|---|---|
| `transactions` | id, user_id, title, amount, category, type, date, bank_source | ✅ |
| `subscriptions` | id, user_id, name, amount, billing_cycle, next_billing_date, bank_source | ✅ |
| `installments` | id, user_id, name, total_amount, installment_amount, total_installments, paid_installments | ✅ |
| `cards` | id, user_id, name, last_digits, limit_amount, used_amount, due_date | ✅ |
| `goals` | id, user_id, name, target_amount, current_amount, deadline, category | ✅ |
| `profiles` | id, full_name, birth_date, whatsapp | ✅ |
| `support_tickets` | id, user_id, category, description, created_at | ✅ |

---

## 👨‍💻 Autor

Desenvolvido por **Davi Augusto** — [github.com/Gaveta-cmd](https://github.com/Gaveta-cmd)
