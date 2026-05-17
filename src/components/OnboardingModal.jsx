import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Wallet } from 'lucide-react';
import { Button } from './Button';

const CATEGORIES = [
  { key: 'alimentacao',    label: 'Alimentação' },
  { key: 'transporte',     label: 'Transporte' },
  { key: 'moradia',        label: 'Moradia' },
  { key: 'saude',          label: 'Saúde' },
  { key: 'lazer',          label: 'Lazer' },
  { key: 'entretenimento', label: 'Entretenimento' },
  { key: 'produtividade',  label: 'Produtividade' },
  { key: 'outros',         label: 'Outros' },
];

const TOTAL = 3;

const slide = {
  enter: (d) => ({ x: d > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d) => ({ x: d > 0 ? -56 : 56, opacity: 0 }),
};

const transition = { duration: 0.22, ease: 'easeInOut' };

export function OnboardingModal({ onComplete, onSkip }) {
  const [step,       setStep]       = useState(0);
  const [dir,        setDir]        = useState(1);
  const [salary,     setSalary]     = useState('');
  const [goal,       setGoal]       = useState('');
  const [categories, setCategories] = useState([]);
  const [saving,     setSaving]     = useState(false);

  function next() { setDir(1);  setStep((s) => s + 1); }
  function prev() { setDir(-1); setStep((s) => s - 1); }

  function toggle(key) {
    setCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function handleSave() {
    setSaving(true);
    await onComplete({
      monthly_salary:       Number(salary) || null,
      financial_goal:       goal.trim() || null,
      preferred_categories: categories,
    });
    setSaving(false);
  }

  const canNext = step === 0 ? Number(salary) > 0 : true;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onSkip}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Barra de progresso */}
        <div className="h-1 bg-gray-100 dark:bg-dark-bg">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        <div className="p-6">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-accent uppercase tracking-widest">
                  Etapa {step + 1} de {TOTAL}
                </p>
                <h2 className="text-lg font-heading font-extrabold text-gray-900 dark:text-white leading-tight">
                  Personalize seu VibeFinance
                </h2>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conteúdo da etapa */}
          <div className="overflow-hidden min-h-[210px]">
            <AnimatePresence custom={dir} mode="wait">
              {step === 0 && (
                <motion.div key="s0" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={transition}>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Qual é o seu salário mensal? <span className="text-accent">*</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Usamos para calcular sua capacidade de poupança e sugerir metas.
                  </p>
                  <input
                    type="number"
                    min="0"
                    max="9999999"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 text-base"
                  />
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s1" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={transition}>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Qual é o seu principal objetivo financeiro?
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Ex: Comprar uma casa, viajar para Europa, criar reserva de emergência...
                  </p>
                  <textarea
                    rows={5}
                    placeholder="Descreva seu objetivo..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    autoFocus
                    maxLength={500}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none text-sm"
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={transition}>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Em quais categorias você mais gasta?
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Essas categorias serão destacadas no seu painel.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(({ key, label }) => {
                      const on = categories.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggle(key)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left ${
                            on
                              ? 'bg-accent/10 border-accent/40 text-accent'
                              : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:border-accent/30'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${on ? 'bg-accent border-accent' : 'border-gray-300 dark:border-dark-border'}`}>
                            {on && <Check className="w-2.5 h-2.5 text-white" />}
                          </span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-dark-border">
            <div>
              {step > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSkip}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-3 py-2"
              >
                Depois
              </button>

              {step < TOTAL - 1 ? (
                <Button
                  onClick={next}
                  disabled={!canNext}
                  className="py-2 px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar respostas'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
