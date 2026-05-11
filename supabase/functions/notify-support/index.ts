// Edge Function: notify-support
// Recebe um relato de problema do usuário e dispara a notificação interna.
//
// Segurança:
//   - Exige Authorization Bearer válido (usuário logado).
//   - IDENTIDADE (email + nome) vem SEMPRE do auth.getUser() — o body do
//     request é ignorado para esses campos. Isso impede que um cliente
//     malicioso mande userEmail/userName forjados.
//   - Valida tamanho de subject/description (mesmos limites do CHECK na tabela
//     support_tickets).
//
// Saída:
//   - Por padrão, registra um log estruturado (visível em Supabase → Edge
//     Functions → Logs). É o canal mínimo para garantir que ninguém perde
//     bug-report enquanto não houver email/webhook plugado.
//   - Se NOTIFY_WEBHOOK_URL estiver configurada, faz POST JSON nela
//     (Slack incoming webhook, Discord, n8n, Zapier, etc).
//
// Variáveis de ambiente:
//   SUPABASE_URL          — auto
//   SUPABASE_ANON_KEY     — auto
//   ALLOWED_ORIGINS       — opcional, lista separada por vírgula
//   NOTIFY_WEBHOOK_URL    — opcional, URL para POST de notificação

import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_SUBJECT_LEN = 100;
const MIN_DESCRIPTION_LEN = 10;
const MAX_DESCRIPTION_LEN = 2000;

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function getAllowedOrigins(): string[] {
  const env = Deno.env.get("ALLOWED_ORIGINS");
  if (!env) return DEFAULT_ALLOWED_ORIGINS;
  return env.split(",").map((s) => s.trim()).filter(Boolean);
}

function buildCorsHeaders(req: Request): Record<string, string> {
  const allowed = getAllowedOrigins();
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  cors: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnon) {
    return jsonResponse({ error: "Servidor mal configurado." }, 500, cors);
  }

  // Auth — identidade vem do JWT, NUNCA do body.
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse({ error: "Não autorizado." }, 401, cors);
  }
  const user = userData.user;
  const userEmail = user.email ?? "";
  const userName =
    (user.user_metadata as { full_name?: unknown } | null)?.full_name &&
        typeof (user.user_metadata as { full_name?: unknown }).full_name ===
          "string"
      ? String((user.user_metadata as { full_name: string }).full_name)
      : "";

  // Body — só campos do relato. Email/nome do body são IGNORADOS.
  let body: { subject?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo inválido." }, 400, cors);
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const description = typeof body.description === "string"
    ? body.description.trim()
    : "";

  if (!subject || subject.length > MAX_SUBJECT_LEN) {
    return jsonResponse({ error: "Assunto inválido." }, 400, cors);
  }
  if (
    description.length < MIN_DESCRIPTION_LEN ||
    description.length > MAX_DESCRIPTION_LEN
  ) {
    return jsonResponse(
      { error: "Descrição inválida (mínimo 10, máximo 2000 caracteres)." },
      400,
      cors,
    );
  }

  // Log estruturado — visível em Supabase Dashboard → Edge Functions → Logs.
  // Esse é o canal mínimo de notificação enquanto não há webhook/email.
  console.log(
    JSON.stringify({
      event: "support_ticket",
      user_id: user.id,
      user_email: userEmail,
      user_name: userName,
      subject,
      description,
      received_at: new Date().toISOString(),
    }),
  );

  // Webhook opcional (Slack, Discord, n8n…). Falha silenciosa:
  // o ticket já foi salvo no banco; perder a notificação não derruba o relato.
  const webhook = Deno.env.get("NOTIFY_WEBHOOK_URL");
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject,
          description,
          user: { id: user.id, email: userEmail, name: userName },
        }),
      });
    } catch (err) {
      console.error("notify webhook failed", err);
    }
  }

  return jsonResponse({ ok: true }, 200, cors);
});
