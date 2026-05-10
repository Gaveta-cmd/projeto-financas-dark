import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const SUBJECTS = [
  'Erro no login',
  'Bug visual',
  'Erro ao conectar conta',
  'Dados incorretos',
  'Problema com assinatura',
  'Sugestão de melhoria',
  'Outro',
];

export function ReportProblem({ session }) {
  const [subject,     setSubject]     = useState('');
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [status,      setStatus]      = useState(null); // null | 'success' | 'error'
  const [errorMsg,    setErrorMsg]    = useState('');

  const handleSubmit = async () => {
    setStatus(null);
    setErrorMsg('');

    if (!subject) {
      setStatus('error');
      setErrorMsg('Selecione um assunto antes de enviar.');
      return;
    }
    if (description.trim().length < 10) {
      setStatus('error');
      setErrorMsg('Descreva o problema com pelo menos 10 caracteres.');
      return;
    }

    setLoading(true);

    // user_id NÃO é enviado pelo client: a coluna tem DEFAULT auth.uid()
    // no Postgres, então o servidor preenche com o usuário autenticado.
    // Mandar do client permitiria forjar tickets de outras pessoas.
    const { error } = await supabase.from('support_tickets').insert({
      subject,
      description: description.trim(),
      status:      'open',
    });

    if (error) {
      setStatus('error');
      setErrorMsg('Não foi possível enviar o relato. Tente novamente.');
    } else {
      const userName = session.user.user_metadata?.full_name || '';
      const userEmail = session.user.email || '';
      await supabase.functions.invoke('notify-support', {
        body: { subject, description: description.trim(), userEmail, userName },
      });

      setStatus('success');
      setSubject('');
      setDescription('');
      setTimeout(() => setStatus(null), 6000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            Reportar um problema
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Encontrou algo errado? Descreva o que aconteceu e nossa equipe irá analisar.
          </p>
        </div>

        {/* Card */}
        <section className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-6 space-y-5">

          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Detalhes do relato</h2>
          </div>

          {/* Assunto */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Assunto
            </label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled>Selecione um assunto…</option>
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o que aconteceu, quais passos você seguiu e o que esperava que ocorresse…"
              rows={6}
              maxLength={2000}
              className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors resize-none"
            />
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 text-right">
              {description.length} caractere{description.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-emerald-500 text-sm">
                  Obrigado! Nossa equipe analisará seu relato em breve.
                </p>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-accent text-xs p-3 bg-accent/10 rounded-lg"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ação */}
          <div className="flex justify-end pt-1">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Enviar Relato
                </>
              )}
            </motion.button>
          </div>

        </section>
      </div>
    </div>
  );
}
