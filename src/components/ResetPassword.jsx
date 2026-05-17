import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { validatePassword, passwordStrengthLabel } from '../utils/passwordStrength';

const RESET_PWD_ERRORS = {
  'Password should be at least 6 characters': 'A senha deve ter no mínimo 8 caracteres, com maiúscula, número e símbolo.',
  'New password should be different from the old password': 'A nova senha deve ser diferente da anterior.',
  'Auth session missing': 'Link de recuperação expirado. Solicite um novo.',
};

export function ResetPassword({ onDone }) {
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [status,          setStatus]          = useState(null); // null | 'success' | 'error'
  const [errorMsg,        setErrorMsg]        = useState('');

  const pwdStrength = newPassword.length > 0 ? passwordStrengthLabel(newPassword) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setErrorMsg('');

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

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setStatus('error');
      setErrorMsg(RESET_PWD_ERRORS[error.message] ?? 'Erro ao redefinir senha. Tente novamente.');
      setLoading(false);
      return;
    }

    setStatus('success');
    setLoading(false);

    await supabase.auth.signOut({ scope: 'global' });
    setTimeout(() => onDone(), 3000);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center relative overflow-hidden selection:bg-accent/30 selection:text-white">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[60%] h-[50%] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_24px_#ef233c80]">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-heading font-extrabold text-white tracking-tighter">
            Vibe<span className="text-accent">Finance</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-white">
              {status === 'success' ? 'Senha redefinida!' : 'Nova senha'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {status === 'success'
                ? 'Redirecionando para o login em alguns segundos…'
                : 'Escolha uma senha com maiúscula, número e símbolo.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-emerald-400 text-sm font-medium">
                  Senha alterada com sucesso!
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
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
                      required
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 pr-11 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className={`text-xs mt-1.5 transition-colors ${
                    pwdStrength ? pwdStrength.color : 'text-gray-600'
                  }`}>
                    {pwdStrength ? `Força: ${pwdStrength.label}` : 'Maiúscula, número e símbolo obrigatórios'}
                  </p>
                </div>

                {/* Confirmar senha */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 pr-11 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent text-xs"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 mt-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Salvando…' : 'Definir nova senha'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
