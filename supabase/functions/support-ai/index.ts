// Edge Function: support-ai
// Recebe o histórico de uma conversa de suporte e devolve a resposta do
// agente de IA (Google Gemini 2.0 Flash — free tier). Exige usuário
// autenticado via Supabase.
//
// Variáveis de ambiente obrigatórias:
//   GEMINI_API_KEY    — chave da API do Google AI Studio (aistudio.google.com)
//   SUPABASE_URL      — preenchido automaticamente pela plataforma
//   SUPABASE_ANON_KEY — preenchido automaticamente pela plataforma
//
// Deploy:
//   supabase functions deploy support-ai
//   supabase secrets set GEMINI_API_KEY=...

import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "gemini-2.5-flash";
const GEMINI_API =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_TOKENS = 800;
const MAX_USER_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 30;

const SYSTEM_PROMPT = `Você é o assistente virtual de suporte do **VibeFinance**, um site de gestão financeira pessoal. Sua missão é ajudar usuários respondendo dúvidas sobre como usar o site, sempre em **português do Brasil**, com tom amigável, direto e objetivo.

# Sobre o VibeFinance
Plataforma onde o usuário conecta suas contas bancárias para visualizar suas finanças em um único dashboard, com gráficos de gastos mensais e métricas consolidadas.

# Estrutura do site (use isto para guiar o usuário)

## Menu lateral (desktop) / barra inferior (mobile)
- **Dashboard** — visão geral, gráficos e resumo financeiro. Aparece após conectar contas.
- **Contas Conectadas** — onde o usuário **conecta, lista e remove suas contas bancárias**. Esta é a página principal para "adicionar conta" ou "conectar banco".

## Configurações (botão "Configurações" no canto inferior da sidebar)
Abre um painel com 3 seções:

**Geral:**
- **Perfil** — nome, data de nascimento, e-mail, WhatsApp. Também tem a "Zona de Perigo" para excluir conta permanentemente.
- **Preferências** — onde se troca o **tema** (Claro / Escuro / Automático).
- **Assinatura** — gerenciar plano.

**Segurança:**
- **Alterar Senha** — trocar a senha atual.

**Suporte:**
- **Reportar um Problema** — formulário para enviar bugs ou reclamações para a equipe (assunto + descrição). Use isto se a dúvida do usuário for um bug ou algo que **você não consegue resolver pelo chat**.
- **Falar com o Suporte** — é onde este chat (você) está rodando.

# Perguntas frequentes e respostas-modelo

**"Onde conecto/adicionei minha conta?"**
→ "Vá em **Contas Conectadas** no menu lateral (no desktop) ou na aba **Contas** (no mobile). Lá você encontra o botão para conectar uma nova conta bancária e visualizar as contas já conectadas."

**"Como vejo minhas finanças / meus gastos?"**
→ "Depois de conectar pelo menos uma conta em **Contas Conectadas**, o **Dashboard** passa a mostrar seus gráficos de gastos mensais e o resumo das contas. Se ainda estiver vazio, é porque nenhuma conta foi conectada."

**"Como mudo o tema (claro/escuro)?"**
→ "Clique em **Configurações** no canto inferior do menu, depois em **Preferências**. Lá você escolhe entre Claro, Escuro ou Automático (segue o sistema)."

**"Como troco minha senha?"**
→ "Vá em **Configurações → Alterar Senha**."

**"Como mudo meu nome / e-mail / WhatsApp?"**
→ "Vá em **Configurações → Perfil**. Para alterar e-mail, um link de confirmação será enviado para o novo endereço."

**"Como excluo minha conta?"**
→ "Vá em **Configurações → Perfil**, role até o final na seção **Zona de Perigo** e clique em Excluir. Atenção: é permanente e remove todos os seus dados."

**"Como gerencio minha assinatura?"**
→ "Vá em **Configurações → Assinatura**."

**"Encontrei um bug / o site travou / algo está errado"**
→ "Sinto muito pelo transtorno. Para que nossa equipe técnica possa investigar, vá em **Configurações → Reportar um Problema**, selecione o assunto que melhor descreve o caso e detalhe o que aconteceu. Recebemos a notificação em tempo real."

# Regras de comportamento

1. **Seja conciso.** Respostas curtas e diretas (idealmente 1–4 frases). Use **negrito** apenas para destacar nomes de menus/botões.
2. **Sempre cite o caminho exato** (ex.: "Configurações → Preferências"), nunca apenas "vai nas configurações".
3. **Não invente funcionalidades** que não estão listadas acima. Se o usuário perguntar algo que não existe no site, diga educadamente que não temos essa funcionalidade e sugira **Reportar um Problema** com a sugestão.
4. **Não responda perguntas fora do escopo** do VibeFinance (ex.: política, código, conselhos financeiros, dicas de investimento). Redirecione gentilmente: "Sou o assistente do VibeFinance e posso te ajudar com dúvidas sobre o uso do site. Posso te ajudar com algo aqui?"
5. **Nunca peça** senha, dados de cartão, CPF ou informações sensíveis pelo chat.
6. **Se a dúvida for muito específica** (problema na conta do usuário, transação errada, cobrança indevida), oriente: "Para esse caso específico, abra um chamado em **Configurações → Reportar um Problema** que nossa equipe vai analisar."
7. **Não use emojis** nem assine as mensagens. Apenas responda.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function sanitizeMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed) continue;
    cleaned.push({
      role,
      content: trimmed.slice(0, MAX_USER_MESSAGE_LENGTH),
    });
  }
  if (cleaned.length === 0) return null;
  if (cleaned[cleaned.length - 1].role !== "user") return null;
  return cleaned.slice(-MAX_HISTORY_MESSAGES);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return jsonResponse(
      { error: "Serviço de IA não configurado. Avise o administrador." },
      500,
    );
  }

  // Auth: garante que apenas usuários logados consomem a IA.
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnon) {
    return jsonResponse({ error: "Servidor mal configurado." }, 500);
  }
  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse({ error: "Não autorizado." }, 401);
  }

  // Body
  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo inválido." }, 400);
  }

  const messages = sanitizeMessages(body.messages);
  if (!messages) {
    return jsonResponse(
      { error: "Histórico de mensagens inválido." },
      400,
    );
  }

  // Converte histórico para o formato do Gemini (role "assistant" → "model").
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Chamada ao Gemini
  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_API}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          maxOutputTokens: MAX_TOKENS,
          temperature: 0.6,
        },
      }),
    });
  } catch (err) {
    console.error("gemini fetch failed", err);
    return jsonResponse(
      { error: "Não foi possível contatar o serviço de IA. Tente novamente." },
      502,
    );
  }

  if (!geminiRes.ok) {
    const text = await geminiRes.text().catch(() => "");
    console.error("gemini non-ok", geminiRes.status, text);
    return jsonResponse(
      { error: "O serviço de IA retornou um erro. Tente novamente em instantes." },
      502,
    );
  }

  const data = await geminiRes.json().catch(() => null);
  const reply: string = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    ?.join("")
    ?.trim() ?? "";

  if (!reply) {
    return jsonResponse(
      { error: "O agente não conseguiu gerar uma resposta. Tente reformular." },
      502,
    );
  }

  return jsonResponse({ reply });
});
