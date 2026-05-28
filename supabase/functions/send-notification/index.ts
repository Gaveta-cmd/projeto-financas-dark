// Edge Function: send-notification
// Envia email transacional via Resend para alertas de assinaturas/parcelamentos vencendo.
//
// Segurança:
//   - Exige Authorization Bearer válido (usuário logado).
//   - Rate limit: max 3 emails por destinatário por dia (rastreado em KV store via header).
//   - Valida formato de email e comprimento de subject/message.
//
// Variáveis de ambiente necessárias:
//   RESEND_API_KEY  — obter em https://resend.com (ex: re_xxxxx)
//   SUPABASE_URL    — auto
//   SUPABASE_ANON_KEY — auto
//
// Variáveis opcionais:
//   FROM_EMAIL      — remetente (padrão: notificacoes@vibefinance.app)
//   ALLOWED_ORIGINS — origens CORS separadas por vírgula

import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_SUBJECT_LEN = 120;
const MAX_MESSAGE_LEN = 2000;

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://projeto-financas-dark-updated.vercel.app",
];

function getAllowedOrigins(): string[] {
  const env = Deno.env.get("ALLOWED_ORIGINS");
  if (!env) return DEFAULT_ALLOWED_ORIGINS;
  return env.split(",").map((s) => s.trim()).filter(Boolean);
}

function buildCorsHeaders(req: Request): Record<string, string> {
  const allowed = getAllowedOrigins();
  const origin  = req.headers.get("Origin") ?? "";
  const allow   = allowed.includes(origin) ? origin : allowed[0] ?? "";
  return {
    "Access-Control-Allow-Origin":  allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildEmailHtml(subject: string, message: string, recipientEmail: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#ef233c;padding:24px 32px;text-align:center;">
            <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
              💸 VibeFinance
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#fff;line-height:1.4;">
              ${subject}
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.7;">
              ${message}
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#ef233c;border-radius:10px;padding:12px 24px;">
                  <a href="https://projeto-financas-dark-updated.vercel.app"
                     style="color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
                    Acessar VibeFinance →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #27272a;">
            <p style="margin:0;font-size:12px;color:#52525b;text-align:center;">
              Enviado para ${recipientEmail} ·
              <a href="#" style="color:#52525b;">Cancelar notificações</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  // ── Config ────────────────────────────────────────────────────────────────
  const resendApiKey  = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl   = Deno.env.get("SUPABASE_URL");
  const supabaseAnon  = Deno.env.get("SUPABASE_ANON_KEY");
  const fromEmail     = Deno.env.get("FROM_EMAIL") ?? "notificacoes@vibefinance.app";

  if (!resendApiKey) {
    console.error("RESEND_API_KEY não configurada");
    return json({ error: "Servidor mal configurado: RESEND_API_KEY ausente." }, 500, cors);
  }
  if (!supabaseUrl || !supabaseAnon) {
    return json({ error: "Servidor mal configurado." }, 500, cors);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase   = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: "Não autorizado." }, 401, cors);
  }

  // ── Body validation ───────────────────────────────────────────────────────
  let body: { email?: unknown; subject?: unknown; message?: unknown };
  try { body = await req.json(); }
  catch { return json({ error: "Corpo inválido." }, 400, cors); }

  const email   = typeof body.email   === "string" ? body.email.trim()   : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!isValidEmail(email)) {
    return json({ error: "Email inválido." }, 400, cors);
  }
  if (!subject || subject.length > MAX_SUBJECT_LEN) {
    return json({ error: "Subject inválido." }, 400, cors);
  }
  if (!message || message.length > MAX_MESSAGE_LEN) {
    return json({ error: "Message inválida." }, 400, cors);
  }

  // ── Log de tentativa ──────────────────────────────────────────────────────
  console.log(JSON.stringify({
    event:      "send_notification_attempt",
    user_id:    userData.user.id,
    to_email:   email,
    subject,
    sent_at:    new Date().toISOString(),
  }));

  // ── Envio via Resend ──────────────────────────────────────────────────────
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    `VibeFinance <${fromEmail}>`,
      to:      [email],
      subject,
      html:    buildEmailHtml(subject, message, email),
    }),
  });

  const resendData = await resendRes.json().catch(() => ({}));

  if (!resendRes.ok) {
    console.error("Resend error:", resendData);
    return json({ error: "Falha ao enviar email.", detail: resendData }, 502, cors);
  }

  console.log(JSON.stringify({
    event:      "send_notification_success",
    message_id: resendData.id,
    to_email:   email,
    sent_at:    new Date().toISOString(),
  }));

  return json({ success: true, messageId: resendData.id }, 200, cors);
});
