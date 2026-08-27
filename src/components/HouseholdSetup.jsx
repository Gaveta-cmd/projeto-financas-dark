import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, Copy, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Button } from './Button';

const slide = {
  enter: (d) => ({ x: d > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d) => ({ x: d > 0 ? -56 : 56, opacity: 0 }),
};
const transition = { duration: 0.22, ease: 'easeInOut' };

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export function HouseholdSetup({ userId, onComplete }) {
  const [mode,      setMode]      = useState(null); // 'create' | 'join'
  const [step,      setStep]      = useState(0);
  const [dir,       setDir]       = useState(1);
  const [groupName, setGroupName] = useState('');
  const [code,      setCode]      = useState('');
  const [nickname,  setNickname]  = useState('');
  const [income,    setIncome]    = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [created,   setCreated]   = useState(null); // { name, invite_code }
  const [copied,    setCopied]    = useState(false);

  function goTo(m) {
    setMode(m);
    setDir(1);
    setStep(1);
    setError('');
  }

  function copyCode(c) {
    navigator.clipboard.writeText(c).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleCreate() {
    if (!groupName.trim()) { setError('Digite o nome do grupo.'); return; }
    if (!nickname.trim())  { setError('Digite seu apelido.'); return; }
    if (!Number(income) > 0 && income !== '') {
      setError('Informe uma renda válida.'); return;
    }
    setSaving(true);
    setError('');
    try {
      // 1) Criar household
      const { data: hh, error: e1 } = await supabase
        .from('households')
        .insert({ name: groupName.trim(), created_by: userId })
        .select()
        .single();
      if (e1) throw e1;

      // 2) Inserir membro (admin)
      const { error: e2 } = await supabase
        .from('household_members')
        .insert({
          household_id:   hh.id,
          user_id:        userId,
          nickname:       nickname.trim(),
          monthly_income: Number(income) || 0,
          role:           'admin',
        });
      if (e2) throw e2;

      // 3) Atualizar profiles.household_id
      await supabase.from('profiles').update({ household_id: hh.id }).eq('id', userId);

      setCreated(hh);
      setDir(1);
      setStep(2);
    } catch (e) {
      setError(e.message ?? 'Erro ao criar grupo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleJoin() {
    if (!code.trim())     { setError('Digite o código de convite.'); return; }
    if (!nickname.trim()) { setError('Digite seu apelido.'); return; }
    setSaving(true);
    setError('');
    try {
      const { error: e } = await supabase.rpc('join_household_by_code', {
        code:           code.trim().toUpperCase(),
        nickname_param: nickname.trim(),
        income_param:   Number(income) || 0,
      });
      if (e) throw e;
      await onComplete();
    } catch (e) {
      setError(e.message ?? 'Código inválido.');
    } finally {
      setSaving(false);
    }
  }

  // Etapa final: confirmar e entrar
  async function handleFinish() {
    await onComplete();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Home className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-accent uppercase tracking-widest">Casa das Finanças</p>
              <h2 className="text-lg font-heading font-extrabold text-gray-900 dark:text-white leading-tight">
                Configurar grupo familiar
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence custom={dir} mode="wait">

            {/* Etapa 0: escolher criar ou entrar */}
            {step === 0 && (
              <motion.div key="s0" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={transition}>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                  Para começar, crie um grupo familiar ou entre em um grupo já existente usando o código de convite de quem criou.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => goTo('create')}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-accent/50 hover:bg-accent/5 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Criar novo grupo</p>
                      <p className="text-xs text-gray-500 mt-0.5">Você será o admin e poderá convidar os outros</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-accent transition-colors" />
                  </button>

                  <button
                    onClick={() => goTo('join')}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-accent/50 hover:bg-accent/5 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Entrar em grupo existente</p>
                      <p className="text-xs text-gray-500 mt-0.5">Use o código de convite de quem criou o grupo</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-accent transition-colors" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Etapa 1: formulário (criar ou entrar) */}
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={transition}>
                <div className="space-y-4">
                  {mode === 'create' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                        Nome do grupo <span className="text-accent">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Família Santos"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        maxLength={80}
                        autoFocus
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
                      />
                    </div>
                  )}

                  {mode === 'join' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                        Código de convite <span className="text-accent">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: AB12CD34"
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        autoFocus
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm font-mono tracking-widest"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                      Seu apelido <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Como os outros vão te ver"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      maxLength={40}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                      Sua renda mensal (opcional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="R$ 0,00"
                      value={income}
                      onChange={e => setIncome(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Usada para calcular a renda total da casa.</p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-dark-border">
                  <button
                    onClick={() => { setDir(-1); setStep(0); setError(''); }}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-2"
                  >
                    Voltar
                  </button>
                  <Button
                    onClick={mode === 'create' ? handleCreate : handleJoin}
                    disabled={saving}
                    className="py-2 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Salvando...' : mode === 'create' ? 'Criar grupo' : 'Entrar no grupo'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Etapa 2: sucesso na criação — exibir código */}
            {step === 2 && created && (
              <motion.div key="s2" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={transition}>
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-7 h-7 text-green-500" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Grupo "{created.name}" criado!
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Compartilhe o código abaixo com os outros membros da casa.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl p-4 text-center mb-4">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">Código de convite</p>
                  <p className="text-3xl font-mono font-bold tracking-widest text-accent mb-3">
                    {created.invite_code}
                  </p>
                  <button
                    onClick={() => copyCode(created.invite_code)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-sm font-semibold transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar código'}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center mb-5">
                  Cada membro entra com o próprio login e usa este código para se juntar ao grupo.
                </p>

                <Button onClick={handleFinish} className="w-full py-2.5 text-sm">
                  Entrar no painel
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
