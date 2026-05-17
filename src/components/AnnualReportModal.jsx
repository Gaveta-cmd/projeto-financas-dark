import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText } from 'lucide-react';
import { generateAnnualReport } from '../lib/pdfExport';

export function AnnualReportModal({ open, onClose, transactions, userName }) {
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map((t) => t.date.slice(0, 4)));
    const current = String(new Date().getFullYear());
    years.add(current);
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 80));
    generateAnnualReport({ transactions, year: selectedYear, userName });
    setGenerating(false);
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1400);
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
            className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl w-full max-w-sm shadow-2xl shadow-accent/5 overflow-hidden"
          >
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
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Selecionar ano
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>O PDF incluirá:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>Resumo anual (receitas, despesas, saldo)</li>
                  <li>Evolução mensal com patrimônio acumulado</li>
                  <li>Top 5 categorias por gasto</li>
                  <li>Gráfico de receitas vs despesas</li>
                </ul>
              </div>
            </div>

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
                disabled={generating || done}
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
                    Gerar PDF
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
