import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import {
  Mail, Lock, User, Calendar, CheckSquare, Square,
  ArrowRight, Loader2, AlertCircle, TrendingUp, Eye, EyeOff, FlaskConical, ArrowLeft,
} from 'lucide-react';

const today = new Date().toISOString().split('T')[0];
const REMEMBER_KEY = 'vf_remember_email';

function mapAuthError(msg = '') {
  if (msg.includes('Invalid login credentials'))   return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed'))          return 'Confirme seu e-mail antes de fazer login.';
  if (msg.includes('User already registered'))      return 'Este e-mail já está cadastrado.';
  if (msg.includes('rate limit') || msg.includes('Rate limit')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (msg.includes('Unable to validate email'))     return 'Endereço de e-mail inválido.';
  if (msg.includes('Password should be') || msg.includes('password')) return 'A senha deve ter no mínimo 8 caracteres.';
  return 'Ocorreu um erro. Tente novamente.';
}

export function Login({ onLogin, onEnterDemo }) {
  const [mode,         setMode]         = useState('signin');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [fullName,     setFullName]     = useState('');
  const [birthDate,    setBirthDate]    = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [success,      setSuccess]      = useState(null);

  // Reset e-mail para recuperação de senha
  const [resetEmail,   setResetEmail]   = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Carrega e-mail salvo ao montar
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'signup' && password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
        onLogin(data.session);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim(), birth_date: birthDate },
          },
        });
        if (error) throw error;
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
        setMode('signin');
      }
    } catch (err) {
      setError(mapAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!resetEmail.trim()) { setError('Informe seu e-mail.'); return; }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess('Enviamos um link de redefinição para seu email.');
    } catch (err) {
      setError(mapAuthError(err.message));
    } finally {
      setResetLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setSuccess(null);
    setFullName('');
    setBirthDate('');
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center gap-3 mb-10 justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_24px_#ef233c80]">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-heading font-extrabold text-white tracking-tighter">
            Vibe<span className="text-accent">Finance</span>
          </span>
        </motion.div>

        {/* Card */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 shadow-2xl">

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight mb-2">
                {mode === 'signin' ? 'Bem-vindo de volta' : mode === 'signup' ? 'Crie sua conta' : 'Recuperar senha'}
              </h1>
              <p className="text-gray-400 text-sm">
                {mode === 'signin'
                  ? 'Acesse seu painel financeiro pessoal.'
                  : mode === 'signup'
                    ? 'Preencha seus dados para começar.'
                    : 'Vamos te ajudar a recuperar o acesso.'}
              </p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* ── Formulário de recuperação de senha ── */}
            {mode === 'forgot' ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
                  </p>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent transition-colors pointer-events-none" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/30 transition-all"
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2.5 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3"
                      >
                        <AlertCircle className="w-4 h-4 text-accent shrink-0" />
                        <p className="text-accent text-sm">{error}</p>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div key="ok" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3"
                      >
                        <p className="text-emerald-400 text-sm">{success}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={resetLoading}
                    whileTap={{ scale: 0.98 }}
                    className="mt-2 w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-heading font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_#ef233c40]"
                  >
                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" />Enviar link</>}
                  </motion.button>
                </form>

                <button
                  onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
                  className="mt-5 flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
                </button>
              </motion.div>
            ) : (

            /* ── Formulário de login / cadastro ── */
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Campos exclusivos do cadastro */}
                <AnimatePresence initial={false}>
                  {mode === 'signup' && (
                    <motion.div
                      key="signup-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="flex flex-col gap-4 overflow-hidden"
                    >
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent transition-colors pointer-events-none" />
                        <input type="text" placeholder="Nome Completo" value={fullName}
                          onChange={e => setFullName(e.target.value)} required autoComplete="name"
                          className="w-full bg-dark-bg border border-dark-border rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/30 transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent transition-colors pointer-events-none" />
                        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                          required max={today}
                          className="w-full bg-dark-bg border border-dark-border rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/30 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent transition-colors pointer-events-none" />
                  <input type="email" placeholder="seu@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required autoComplete="email"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/30 transition-all"
                  />
                </div>

                {/* Senha */}
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent transition-colors pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'} placeholder="Senha" value={password}
                    onChange={e => setPassword(e.target.value)} required
                    minLength={mode === 'signup' ? 8 : undefined}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/30 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Lembrar de mim — apenas no signin */}
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setRememberMe(v => !v)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors w-fit"
                  >
                    {rememberMe
                      ? <CheckSquare className="w-4 h-4 text-accent" />
                      : <Square className="w-4 h-4" />}
                    Lembrar de mim
                  </button>
                )}

                {/* Feedback */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div key="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2.5 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3"
                    >
                      <AlertCircle className="w-4 h-4 text-accent shrink-0" />
                      <p className="text-accent text-sm">{error}</p>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div key="success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2.5 bg-white/5 border border-white/20 rounded-xl px-4 py-3"
                    >
                      <p className="text-white text-sm">{success}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botão submit */}
                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                  className="mt-2 w-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-heading font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_#ef233c40] hover:shadow-[0_0_30px_#ef233c60]"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <>{mode === 'signin' ? 'Entrar' : 'Criar conta'}<ArrowRight className="w-4 h-4" /></>
                  }
                </motion.button>
              </form>

              {/* Esqueceu a senha — apenas no signin */}
              {mode === 'signin' && (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); setSuccess(null); setResetEmail(email); }}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}

              {/* Botão Demo */}
              {onEnterDemo && (
                <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onEnterDemo}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dark-border text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
                >
                  <FlaskConical className="w-4 h-4" />
                  Explorar sem cadastro →
                </motion.button>
              )}

              {/* Alternar modo */}
              <p className="mt-6 text-center text-gray-500 text-sm">
                {mode === 'signin' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
                <button onClick={switchMode} className="text-accent hover:text-accent/80 font-semibold transition-colors">
                  {mode === 'signin' ? 'Criar conta' : 'Fazer login'}
                </button>
              </p>
            </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Seus dados são criptografados e protegidos.
        </p>
      </motion.div>
    </div>
  );
}
