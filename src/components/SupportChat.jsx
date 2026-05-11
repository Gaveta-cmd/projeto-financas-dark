import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const SUGGESTIONS = [
  'Onde adiciono uma conta bancária?',
  'Como mudo o tema do site?',
  'Como troco minha senha?',
  'Como vejo meus gastos mensais?',
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    'Olá! Sou o assistente do VibeFinance. Posso te ajudar com dúvidas sobre como usar o site — conectar contas, ver suas finanças, mudar configurações e mais. Como posso te ajudar?',
};

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-accent text-white rounded-br-md'
            : 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-800 dark:text-gray-100 rounded-bl-md'
        }`}
      >
        {message.content.split('\n').map((line, i) => (
          <div key={i}>{renderInline(line) || <>&nbsp;</>}</div>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse [animation-delay:200ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse [animation-delay:400ms]" />
      </div>
    </div>
  );
}

export function SupportChat() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const autoSize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError('');
    const next = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const payload = next
        .filter((m) => m !== INITIAL_MESSAGE)
        .map(({ role, content }) => ({ role, content }));

      const { data, error: fnError } = await supabase.functions.invoke(
        'support-ai',
        { body: { messages: payload } },
      );

      if (fnError) {
        // FunctionsHttpError → função respondeu com 4xx/5xx (extrai o JSON).
        // FunctionsFetchError → fetch nem chegou na função (deploy / rede / CORS).
        let serverMsg = '';
        try {
          const ctx = fnError.context;
          if (ctx && typeof ctx.json === 'function') {
            const parsed = await ctx.json();
            serverMsg = parsed?.error || '';
          }
        } catch { /* ignore */ }

        if (!serverMsg && fnError.name === 'FunctionsFetchError') {
          serverMsg =
            'Não foi possível alcançar o serviço de IA. Verifique se a Edge Function "support-ai" está deployada (supabase functions deploy support-ai).';
        }

        throw new Error(serverMsg || fnError.message || 'Falha na requisição.');
      }

      const reply = data?.reply;
      if (!reply) throw new Error('Resposta vazia do agente.');

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.message || 'Erro ao falar com o agente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg px-4 pt-28 lg:pt-12 pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto h-[calc(100vh-13rem)] md:h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] flex flex-col">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-accent" />
            Falar com o Suporte
          </h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Assistente de IA — tire suas dúvidas sobre o uso do site
          </p>
        </div>

        {/* Card do chat */}
        <section className="flex-1 min-h-0 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl flex flex-col overflow-hidden">

          {/* Lista de mensagens */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-slate-50/50 dark:bg-dark-bg/40"
          >
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <MessageBubble message={m} />
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sugestões iniciais */}
            {messages.length === 1 && !loading && (
              <div className="pt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 hover:border-accent/50 hover:text-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Erro */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-4 mb-2 flex items-start gap-2 p-2.5 bg-accent/10 border border-accent/20 rounded-lg"
              >
                <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                <p className="text-accent text-xs">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-dark-border p-3 bg-white dark:bg-dark-surface">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoSize(e.target);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte qualquer coisa sobre o VibeFinance…"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors disabled:opacity-60"
                style={{ maxHeight: '160px' }}
              />
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="shrink-0 w-10 h-10 rounded-xl bg-accent hover:bg-red-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Enviar"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </motion.button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1.5 px-1">
              As respostas são geradas por IA e podem conter erros. Para problemas específicos, use Reportar um Problema.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
