import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Laugh, TrendingUp, ChevronDown, ChevronUp,
  Info, Users, Wallet, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useHousehold }      from '../../hooks/useHousehold';
import { useDemoMode }       from '../../contexts/DemoContext';
import { useHouseholdCtx }   from '../../contexts/HouseholdContext';

// ─── CONSTANTE: mapeamento de categorias → macro ──────────────────────────────
// Edite aqui para ajustar quais categorias pertencem a cada bloco.
export const MACRO_MAP = {
  alimentacao:   'essenciais',
  moradia:       'essenciais',
  saude:         'essenciais',
  produtividade: 'essenciais',
  transporte:    'essenciais',
  outros:        'essenciais',
  lazer:         'lazer',
  entretenimento:'lazer',
  metas:         'futuro',
};

const MACROS = [
  {
    id: 'essenciais',
    label: 'Essenciais da Casa',
    description: 'Mercado, luz, água, saúde, educação dos dependentes',
    icon: Home,
    color: '#6366f1',
    target: 0.65,
    glow: 'shadow-indigo-500/20',
  },
  {
    id: 'lazer',
    label: 'Lazer & Desejos',
    description: 'iFood, passeios, streaming, compras pessoais',
    icon: Laugh,
    color: '#f59e0b',
    target: 0.20,
    glow: 'shadow-amber-500/20',
  },
  {
    id: 'futuro',
    label: 'Futuro',
    description: 'Reserva de emergência e investimentos',
    icon: TrendingUp,
    color: '#10b981',
    target: 0.15,
    glow: 'shadow-emerald-500/20',
  },
];

const MEMBER_COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899'];

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function brl(n) {
  return Math.abs(Number(n)).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function barColor(ratio, targetColor) {
  if (ratio > 1.05) return '#ef233c';    // acima do limite: vermelho
  if (ratio > 0.90) return '#f59e0b';    // quase no limite: âmbar
  return targetColor;                    // saudável: cor da macro-categoria
}

// ─── Animações ────────────────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function RuleBar({ spent, target, income, color }) {
  const targetAmt = income * target;
  const ratio     = targetAmt > 0 ? spent / targetAmt : 0;
  const fillPct   = Math.min(ratio * 100, 100);
  const overPct   = ratio > 1 ? Math.min((ratio - 1) * 100, 20) : 0;
  const fill      = barColor(ratio, color);

  return (
    <div className="relative h-3 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
      {/* Target marker */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/60 dark:bg-white/30 z-10"
        style={{ left: '100%', transform: 'translateX(-1px)' }}
      />
      <motion.div
        className="h-full rounded-full"
        style={{ background: fill }}
        initial={{ width: 0 }}
        animate={{ width: `${fillPct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
      />
      {overPct > 0 && (
        <motion.div
          className="absolute top-0 right-0 h-full rounded-r-full bg-accent/30"
          initial={{ width: 0 }}
          animate={{ width: `${overPct}%` }}
          transition={{ duration: 0.5, delay: 0.9 }}
        />
      )}
    </div>
  );
}

function MemberBar({ nickname, amount, total, color }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
        style={{ background: color }}
      >
        {initials(nickname)}
      </span>
      <span className="text-xs text-gray-600 dark:text-gray-400 w-14 truncate">{nickname}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 w-24 text-right shrink-0">
        R$ {brl(amount)}
      </span>
    </div>
  );
}

function MacroCard({ macro, spent, income, memberBreakdown, members }) {
  const [expanded, setExpanded] = useState(false);
  const Icon      = macro.icon;
  const targetAmt = income * macro.target;
  const ratio     = targetAmt > 0 ? spent / targetAmt : 0;
  const diff      = spent - targetAmt;
  const isOver    = diff > 0;
  const fill      = barColor(ratio, macro.color);

  const statusLabel = ratio > 1.05
    ? { text: `${((ratio - 1) * 100).toFixed(0)}% acima da meta`, cls: 'text-accent', icon: AlertTriangle }
    : ratio > 0.90
    ? { text: `${(ratio * 100).toFixed(0)}% da meta — atenção`, cls: 'text-amber-400', icon: Info }
    : { text: `${(ratio * 100).toFixed(0)}% da meta — saudável`, cls: 'text-emerald-500', icon: CheckCircle2 };

  const StatusIcon = statusLabel.icon;

  return (
    <motion.div variants={item}>
      <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl overflow-hidden">
        {/* Header da card */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${macro.color}1a` }}
              >
                <Icon className="w-5 h-5" style={{ color: macro.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-white">
                    {macro.label}
                  </h3>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
                    style={{ color: macro.color, background: `${macro.color}15`, borderColor: `${macro.color}30` }}
                  >
                    Meta {(macro.target * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{macro.description}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xl font-heading font-extrabold text-gray-900 dark:text-white">
                R$ {brl(spent)}
              </p>
              <p className="text-xs text-gray-400">de R$ {brl(targetAmt)}</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <RuleBar spent={spent} target={macro.target} income={income} color={macro.color} />

          <div className="flex items-center justify-between mt-2">
            <div className={`flex items-center gap-1 text-xs font-semibold ${statusLabel.cls}`}>
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              {statusLabel.text}
            </div>
            <span className={`text-xs font-bold ${isOver ? 'text-accent' : 'text-emerald-500'}`}>
              {isOver ? `+ R$ ${brl(diff)} acima` : `− R$ ${brl(Math.abs(diff))} de sobra`}
            </span>
          </div>
        </div>

        {/* Breakdown por membro (expansível) */}
        {members.length > 1 && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-dark-border text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Ver contribuição por membro
              </span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-3 bg-gray-50/50 dark:bg-dark-bg/30">
                    {members.map((m, i) => (
                      <MemberBar
                        key={m.user_id}
                        nickname={m.nickname}
                        amount={memberBreakdown[m.user_id] ?? 0}
                        total={spent}
                        color={MEMBER_COLORS[i % MEMBER_COLORS.length]}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-dark-border rounded-xl ${className}`} />;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PlanejamentoTab() {
  const { isDemo, demoData }     = useDemoMode();
  const hhCtx                    = useHouseholdCtx();
  const { totalHouseholdIncome, fetchHouseholdTransactions } = useHousehold();
  const [showInfo,        setShowInfo]       = useState(false);
  const [transactions,    setTransactions]   = useState([]);
  const [loadingTx,       setLoadingTx]      = useState(true);

  const members = hhCtx?.members ?? [];
  const income  = totalHouseholdIncome;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingTx(true);
      let txs = [];
      if (isDemo) {
        txs = (demoData?.transactions ?? []).filter(t => t.type === 'expense');
      } else {
        txs = await fetchHouseholdTransactions(currentMonthStr());
        txs = txs.filter(t => t.type === 'expense');
      }
      if (!cancelled) { setTransactions(txs); setLoadingTx(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [isDemo, demoData, fetchHouseholdTransactions]);

  // ── Cálculos ────────────────────────────────────────────────────────────
  const { macroSpend, memberByMacro } = useMemo(() => {
    const macroSpend    = { essenciais: 0, lazer: 0, futuro: 0 };
    const memberByMacro = {
      essenciais: {},
      lazer:      {},
      futuro:     {},
    };

    for (const t of transactions) {
      const macro = MACRO_MAP[t.category];
      if (!macro) continue;
      const amt = Number(t.amount);
      macroSpend[macro] = (macroSpend[macro] ?? 0) + amt;
      memberByMacro[macro][t.user_id] = (memberByMacro[macro][t.user_id] ?? 0) + amt;
    }

    return { macroSpend, memberByMacro };
  }, [transactions]);

  const totalSpent = Object.values(macroSpend).reduce((s, v) => s + v, 0);
  const sobraReal  = income - totalSpent;

  // Perfil de cada membro: quanto colocou vs. quanto gastou
  const memberProfile = useMemo(() => {
    const spent = {};
    for (const t of transactions) {
      spent[t.user_id] = (spent[t.user_id] ?? 0) + Number(t.amount);
    }
    return members.map((m, i) => ({
      ...m,
      spent:  spent[m.user_id] ?? 0,
      color:  MEMBER_COLORS[i % MEMBER_COLORS.length],
      sobra:  m.monthly_income - (spent[m.user_id] ?? 0),
    }));
  }, [members, transactions]);

  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  if (loadingTx) {
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-16 w-2/3" />
        <div className="grid gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* HEADER */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
            Inteligência Financeira
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            Planejamento <span className="text-accent">Inteligente</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Regra 65/20/15 adaptada — {memberProfile.filter(m => m.monthly_income > 0).length} rendas para {members.length} pessoas · {monthLabel}
          </p>
        </div>
        <button
          onClick={() => setShowInfo((v) => !v)}
          className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-accent/40 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          Por que 65/20/15?
        </button>
      </motion.div>

      {/* INFO BANNER */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            variants={item}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-sm text-indigo-300 space-y-1.5">
              <p className="font-bold text-white">Por que não a regra 50/30/20 padrão?</p>
              <p>Com {members.length} pessoas na casa e apenas {memberProfile.filter(m => m.monthly_income > 0).length} com renda, os <strong>essenciais pesam mais</strong>. A regra 65/20/15 reconhece isso: 65% para as necessidades coletivas, 20% para qualidade de vida e 15% para construir o futuro — um equilíbrio mais realista para famílias maiores.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDA TOTAL */}
      <motion.div variants={item}>
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Renda Total da Casa</p>
                <p className="text-2xl font-heading font-extrabold text-gray-900 dark:text-white">
                  R$ {brl(income)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {memberProfile.map((m) => (
                <div key={m.user_id} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: m.color }}
                  >
                    {initials(m.nickname)}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">{m.nickname}</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">R$ {brl(m.monthly_income)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* MACRO-CATEGORIAS */}
      <div className="grid grid-cols-1 gap-4">
        {MACROS.map((macro) => (
          <MacroCard
            key={macro.id}
            macro={macro}
            spent={macroSpend[macro.id] ?? 0}
            income={income}
            memberBreakdown={memberByMacro[macro.id] ?? {}}
            members={memberProfile}
          />
        ))}
      </div>

      {/* SOBRA REAL */}
      <motion.div variants={item}>
        <div className={`relative overflow-hidden rounded-2xl border p-6 ${
          sobraReal >= 0
            ? 'bg-emerald-500/5 border-emerald-500/25'
            : 'bg-accent/5 border-accent/25'
        }`}>
          {/* Glow de fundo */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-2xl"
            style={{ background: sobraReal >= 0 ? '#10b981' : '#ef233c' }}
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                sobraReal >= 0 ? 'bg-emerald-500/15' : 'bg-accent/15'
              }`}>
                {sobraReal >= 0
                  ? <Sparkles className="w-6 h-6 text-emerald-500" />
                  : <AlertTriangle className="w-6 h-6 text-accent" />
                }
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sobra Real do Mês
                </p>
                <p className={`text-4xl font-heading font-extrabold tracking-tight ${
                  sobraReal >= 0 ? 'text-emerald-500' : 'text-accent'
                }`}>
                  {sobraReal < 0 ? '−' : '+'} R$ {brl(sobraReal)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {sobraReal >= 0
                    ? `Dinheiro líquido disponível após todas as despesas (${((sobraReal / income) * 100).toFixed(1)}% da renda)`
                    : `Os gastos ultrapassaram a renda em R$ ${brl(Math.abs(sobraReal))}`
                  }
                </p>
              </div>
            </div>

            {/* Detalhamento da sobra por membro */}
            {sobraReal >= 0 && (
              <div className="flex flex-col gap-2 sm:min-w-[220px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sobra individual estimada</p>
                {memberProfile.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                        style={{ background: m.color }}
                      >
                        {initials(m.nickname)}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{m.nickname}</span>
                    </div>
                    <span className={`text-xs font-heading font-bold ${m.sobra >= 0 ? 'text-emerald-500' : 'text-accent'}`}>
                      {m.sobra >= 0 ? '+' : '−'} R$ {brl(m.sobra)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* GUIA DE DISTRIBUIÇÃO IDEAL */}
      <motion.div variants={item}>
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-5">
          <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-white mb-4">
            Distribuição ideal × real
          </h3>
          <div className="space-y-3">
            {MACROS.map((macro) => {
              const Icon     = macro.icon;
              const spent    = macroSpend[macro.id] ?? 0;
              const idealAmt = income * macro.target;
              const realPct  = income > 0 ? (spent / income) * 100 : 0;
              const idealPct = macro.target * 100;
              const diff     = realPct - idealPct;

              return (
                <div key={macro.id} className="flex items-center gap-4">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${macro.color}1a` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: macro.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{macro.label}</span>
                      <div className="flex items-center gap-2 shrink-0 text-[11px]">
                        <span className="text-gray-400">meta {idealPct.toFixed(0)}%</span>
                        <span className={`font-bold ${
                          Math.abs(diff) < 2 ? 'text-emerald-500' :
                          diff > 0 ? 'text-accent' : 'text-emerald-500'
                        }`}>
                          real {realPct.toFixed(0)}%
                          {Math.abs(diff) >= 2 && ` (${diff > 0 ? '+' : ''}${diff.toFixed(0)}pp)`}
                        </span>
                      </div>
                    </div>
                    {/* Barra dupla: ideal (fundo) + real (frente) */}
                    <div className="relative h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                      {/* Faixa ideal */}
                      <div
                        className="absolute top-0 left-0 h-full rounded-full opacity-20"
                        style={{ width: `${idealPct}%`, background: macro.color }}
                      />
                      <motion.div
                        className="absolute top-0 left-0 h-full rounded-full"
                        style={{ background: barColor(realPct / idealPct, macro.color) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(realPct, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
