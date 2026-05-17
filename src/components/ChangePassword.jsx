import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useDemoMode } from '../contexts/DemoContext';
import { validatePassword, passwordStrengthLabel } from '../utils/passwordStrength';

const CHANGE_PWD_ERRORS = {
  'Password should be at least 6 characters': 'A nova senha deve ter no mínimo 8 caracteres.',
  'New password should be different from the old password': 'A nova senha deve ser diferente da atual.',
  'Auth session missing': 'Sessão expirada. Faça login novamente.',
};

export function ChangePassword({ session, onCancel }) {
  const { isDemo, showDemoBlock } = useDemoMode();
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [showCurrent,      setShowCurrent]      = useState(false);
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [status,           setStatus]           = useState(null); // null | 'success' | 'error'
  const [errorMsg,         setErrorMsg]         = useState('');

  const isLongEnough = newPassword.length >= 8;
  const pwdStrength  = newPassword.length > 0 ? passwordStrengthLabel(newPassword) : null;

  const handleSubmit = async () => {
    if (isDemo) { showDemoBlock(); return; }
    setStatus(null);
    setErrorMsg('');

    if (!currentPassword) {
      setStatus('error');
      setErrorMsg('Informe sua senha atual.');
      return;
    }
    const pwdErrors = validatePassword(newPassword);
    if (pwdErrors.length > 0) {
      setStatus('error');
      setErrorMsg(`Senha inválida: ${pwdErrors.join(', ')}.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setErrorMsg('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    setLoading(true);

    // Verifica senha atual re-autenticando
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    });

    if (signInError) {
      setStatus('error');
      setErrorMsg('Senha atual incorreta.');
      setLoading(false);
      return;
    }

    // Atualiza para a nova senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setStatus('error');
      setErrorMsg(CHANGE_PWD_ERRORS[updateError.message] ?? 'Erro ao atualizar senha. Tente novamente.');
    } else {
      setStatus('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatus(null), 4000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg px-4 pt-28 lg:pt-12 pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            Trocar senha
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Use 8 ou mais caracteres com uma mistura de letras, números e símbolos.
          </p>
        </div>

        {/* Card */}
        <section className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-6 space-y-5">

          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Segurança</h2>
          </div>

          {/* Senha atual */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Senha atual
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 pr-11 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Nova senha
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 pr-11 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className={`text-xs mt-1.5 transition-colors ${
              pwdStrength ? pwdStrength.color : 'text-gray-400 dark:text-gray-500'
            }`}>
              {pwdStrength ? `Força: ${pwdStrength.label}` : 'Maiúscula, número e símbolo obrigatórios'}
            </p>
          </div>

          {/* Confirmar nova senha */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Confirme a nova senha
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 pr-11 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-500 text-xs"
              >
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Senha alterada com sucesso!
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

          {/* Ações */}
          <div className="flex items-center justify-end gap-4 pt-1">
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? 'Salvando…' : 'Trocar Senha'}
            </button>
          </div>

        </section>
      </div>
    </div>
  );
}
