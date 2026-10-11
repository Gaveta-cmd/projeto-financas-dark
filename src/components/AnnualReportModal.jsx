import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, AlertCircle } from 'lucide-react';
import { exportAnnualReport } from '../lib/pdfExport';
import { api } from '../lib/api';

function defaultDates() {
  const year = new Date().getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export function AnnualReportModal({ open, onClose, transactions, userName, isDemo, demoData }) {
  const defaults = defaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate,   setEndDate]   = useState(defaults.end);
  const [generating, setGenerating] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');

  const days = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return null;
    return daysBetween(startDate, endDate);
  }, [startDate, endDate]);

  const isValid = !!startDate && !!endDate && startDate <= endDate && (days ?? 0) <= 366;

  const handleGenerate = async () => {
    setError('');
    if (!startDate || !endDate) { setError('Preencha as duas datas.'); return; }
    if (startDate > endDate)    { setError('A data início deve ser anterior à data fim.'); return; }
    if ((days ?? 0) > 366)      { setError('O período máximo permitido é de 365 dias.'); return; }

    setGenerating(true);
    try {
      let installments = [], subscriptions = [], goals = [];

      if (isDemo) {
        installments = demoData?.installments  ?? [];
        subscriptions = demoData?.subscriptions ?? [];
        goals         = demoData?.goals         ?? [];
      } else {
        const [instRes, subRes, goalRes] = await Promise.allSettled([
          api.from('installments').select('*'),
          api.from('subscriptions').select('*'),
          api.from('goals').select('*'),
        ]);
        if (instRes.status  === 'fulfilled' && !instRes.value.error)  installments  = instRes.value.data  ?? [];
        if (subRes.status   === 'fulfilled' && !subRes.value.error)   subscriptions = subRes.value.data   ?? [];
        if (goalRes.status  === 'fulfilled' && !goalRes.value.error)  goals         = goalRes.value.data  ?? [];
      }

      await new Promise((r) => setTimeout(r, 80));

      exportAnnualReport({ transactions, installments, subscriptions, goals, startDate, endDate, userName });

      setDone(true);
      setTimeout(() => { setDone(false); onClose(); }, 1400);
    } catch {
      setError('Não foi possível gerar o relatório. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl w-full max-w-md shadow-2xl shadow-accent/5 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg">Relatório Anual</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Data início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Data fim
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Period pill */}
              {days !== null && (
                <div className={`text-xs px-3 py-2 rounded-lg border ${days > 365 ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400'}`}>
                  {days > 365
                    ? `Período de ${days} dias excede o limite de 365 dias`
                    : `Período selecionado: ${days} dia${days !== 1 ? 's' : ''}`
                  }
                </div>
              )}

              {/* What's included */}
              <div className="p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-xs text-gray-500 dark:text-gray-400">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">O PDF incluirá:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>Capa com período selecionado</li>
                  <li>Resumo anual e evolução mensal</li>
                  <li>Detalhamento por trimestre</li>
                  <li>Análise por categoria com gráfico</li>
                  <li>Assinaturas e parcelamentos</li>
                  <li>Metas financeiras</li>
                  <li>Top 10 maiores transações</li>
                  <li>Conclusões e estatísticas</li>
                </ul>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-2.5 bg-accent/10 border border-accent/20 rounded-lg"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <p className="text-accent text-xs">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/40">
              <button
                onClick={onClose}
                disabled={generating}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerate}
                disabled={generating || done || !isValid}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Gerando…
                  </>
                ) : done ? (
                  <>✓ PDF baixado!</>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Baixar PDF
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
