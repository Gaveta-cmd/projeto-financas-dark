# 💰 VibeFinance — Personal Finance Dashboard

> **⚠️ PROJETO EM DESENVOLVIMENTO:** Este sistema está sendo construído ativamente para fins de aprendizado e organização financeira pessoal. Funcionalidades e interface estão em constante evolução.

Um dashboard de finanças pessoais focado em estética **High-End Tech**, com autenticação real, integração a bancos brasileiros, gráficos interativos e suporte via IA.

🌐 **[Acesse o site ao vivo → projeto-financas-dark.vercel.app](https://projeto-financas-dark.vercel.app)**

---

## 🚀 Status do Projeto
Atualmente em: **Fase de Expansão de Funcionalidades e Integração com Backend**.

## 🛠️ Tecnologias Utilizadas
- **React 19** (Vite)
- **Tailwind CSS** (Estilização)
- **Framer Motion** (Animações de interface)
- **Lucide React** (Ícones)
- **Supabase** (Autenticação, Banco de Dados PostgreSQL e Edge Functions)
- **Recharts** (Gráficos interativos)
- **Vercel** (Deploy e hospedagem)
- **Git/GitHub** (Versionamento e Backup)

## 🎨 Design System & Estética
O projeto segue uma identidade visual rigorosa inspirada no estilo "Linear/Vercel":
- **Background:** `#0f0f0f` (Deep Black)
- **Surfaces:** `#18181b` (Zinc-900) com bordas tracejadas e efeitos de brilho
- **Accents:** `#ef233c` (Electric Red) para destaques e ações principais
- **Tipografia:** `Manrope` (títulos) + `Inter` (corpo) via Google Fonts
- **Animações:** `fadeSlideIn`, `columnReveal`, `border-spin-gradient` e `hover-beam`
- **Temas:** Suporte completo a Dark / Light / Automático (detecta preferência do SO)

## 📊 Funcionalidades

### ✅ Implementadas
- [x] Autenticação completa (Sign In / Sign Up) via Supabase Auth
- [x] Dashboard com abas: Visão Geral, Transações, Parcelamentos, Assinaturas, Categorias e Bancos
- [x] Visão Geral com saldo total, KPIs, gráfico mensal e regra 50/30/20 animada
- [x] Ao conectar um banco, popula automaticamente transações, parcelamentos e assinaturas realistas
- [x] Ao desconectar um banco, remove todos os dados vinculados a ele
- [x] Integração simulada com 8 bancos brasileiros (Nubank, Inter, Itaú, Bradesco, C6, PicPay, Santander, Caixa)
- [x] Tela de Transações com cadastro manual, categorização e exclusão
- [x] Tela de Parcelamentos com progresso visual de cada compra parcelada
- [x] Tela de Assinaturas com serviços recorrentes e total mensal
- [x] Tela de Categorias com gráfico de pizza e breakdown por categoria
- [x] Tela de Metas Financeiras com progresso visual e fluxo de conquista
- [x] Página de Perfil com edição de nome, e-mail e WhatsApp (seletor de país)
- [x] Troca de senha com reautenticação e validação em tempo real
- [x] Exclusão permanente de conta com modal de confirmação
- [x] Preferências de tema e efeitos sonoros
- [x] Chat de Suporte com IA via Edge Function do Supabase
- [x] Formulário de reportar problemas com salvamento no banco de dados
- [x] Layout totalmente responsivo (Sidebar no desktop, Bottom Nav no mobile)
- [x] Deploy na Vercel com CI/CD automático a cada push

### 🔧 Em Desenvolvimento
- [ ] Integração real com Open Finance / APIs bancárias
- [ ] Notificações e alertas de vencimento de parcelas e assinaturas
- [ ] Exportação de relatórios em PDF

## 💻 Como rodar o projeto localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/Gaveta-cmd/projeto-financas-dark.git
   cd projeto-financas-dark

2. Instale as dependências:
   npm install

3. Configure as variáveis de ambiente — crie um arquivo .env na raiz:
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima

4. Rode em modo desenvolvimento:
   npm run dev
