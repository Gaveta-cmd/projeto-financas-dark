import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Trash2, Save,
  AlertTriangle, CheckCircle, Info, ChevronDown, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Card } from './Card';
import { Button } from './Button';
import { useDemoMode } from '../contexts/DemoContext';
import { DEMO_USER } from '../data/demoData';

const COUNTRIES = [
  { flag: '🇧🇷', name: 'Brasil',      code: '+55'  },
  { flag: '🇺🇸', name: 'EUA',         code: '+1'   },
  { flag: '🇵🇹', name: 'Portugal',    code: '+351' },
  { flag: '🇦🇷', name: 'Argentina',   code: '+54'  },
  { flag: '🇨🇴', name: 'Colômbia',    code: '+57'  },
  { flag: '🇲🇽', name: 'México',      code: '+52'  },
  { flag: '🇪🇸', name: 'Espanha',     code: '+34'  },
  { flag: '🇬🇧', name: 'Reino Unido', code: '+44'  },
  { flag: '🇫🇷', name: 'França',      code: '+33'  },
  { flag: '🇩🇪', name: 'Alemanha',    code: '+49'  },
];

function formatPhoneLocal(raw, countryCode) {
  const d = raw.replace(/\D/g, '');
  if (countryCode === '+55') {
    if (!d) return '';
    if (d.length <= 2)  return `(${d}`;
    if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
  }
  if (countryCode === '+1') {
    if (!d) return '';
    if (d.length <= 3) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
  }
  return d;
}

function parseStoredPhone(stored) {
  if (!stored) return { country: COUNTRIES[0], local: '' };
  for (const c of COUNTRIES) {
    if (stored.startsWith(c.code)) {
      return { country: c, local: stored.slice(c.code.length).trim() };
    }
  }
  return { country: COUNTRIES[0], local: stored };
}

export function Profile({ session, onLogout }) {
  const { isDemo, showDemoBlock } = useDemoMode();
  const user = session?.user;

  // ── Informações Pessoais ──
  const [nome, setNome]                     = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [saving, setSaving]                 = useState(false);
  const [saveStatus, setSaveStatus]         = useState(null); // null | 'success' | 'error'
  const [saveMsg, setSaveMsg]               = useState('');

  // ── Informações de Contato ──
  const [email, setEmail]                   = useState('');
  const [originalEmail, setOriginalEmail]   = useState('');
  const [country, setCountry]               = useState(COUNTRIES[0]);
  const [whatsappLocal, setWhatsappLocal]   = useState('');
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [savingContact, setSavingContact]   = useState(false);
  const [contactStatus, setContactStatus]   = useState(null); // null | 'success' | 'email_pending' | 'error'
  const [contactMsg, setContactMsg]         = useState('');

  // ── Zona de Perigo ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [loading, setLoading] = useState(!isDemo && !!user?.id);

  useEffect(() => {
    if (isDemo) {
      setNome(DEMO_USER.name);
      setEmail(DEMO_USER.email);
      setOriginalEmail(DEMO_USER.email);
      setDataNascimento('1998-05-10');
      setLoading(false);
      return;
    }

    if (!user?.id) return;

    async function loadProfile() {
      const authEmail = user?.email ?? '';
      setEmail(authEmail);
      setOriginalEmail(authEmail);
      setNome(user?.user_metadata?.full_name ?? '');
      setDataNascimento(user?.user_metadata?.birth_date ?? '');

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, birth_date, whatsapp')
        .eq('id', user?.id)
        .single();

      if (!error && data) {
        if (data.full_name)  setNome(data.full_name);
        if (data.birth_date) setDataNascimento(data.birth_date);
        const parsed = parseStoredPhone(data.whatsapp ?? '');
        setCountry(parsed.country);
        setWhatsappLocal(parsed.local);
      }
      setLoading(false);
    }

    loadProfile();
  }, [user, isDemo]);

  // Salva nome + data de nascimento
  const handleSave = async () => {
    if (isDemo) { showDemoBlock(); return; }
    setSaving(true);
    setSaveStatus(null);
    setSaveMsg('');

    const { error: authErr } = await supabase.auth.updateUser({
      data: { full_name: nome, birth_date: dataNascimento },
    });

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: user?.id, full_name: nome, birth_date: dataNascimento });

    const err = authErr || profileErr;
    if (err) {
      setSaveStatus('error');
      setSaveMsg(err.message);
    } else {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3500);
    }
    setSaving(false);
  };

  // Salva whatsapp e, se o e-mail mudou, dispara confirmação
  const handleSaveContact = async () => {
    if (isDemo) { showDemoBlock(); return; }
    setSavingContact(true);
    setContactStatus(null);
    setContactMsg('');

    const digits = whatsappLocal.replace(/\D/g, '');
    const fullNumber = digits ? `${country.code}${digits}` : '';

    if (digits && digits.length < 8) {
      setContactStatus('error');
      setContactMsg('Número muito curto. Verifique o número e tente novamente.');
      setSavingContact(false);
      return;
    }

    const { error: whatsappErr } = await supabase
      .from('profiles')
      .upsert({ id: user?.id, whatsapp: fullNumber });

    if (whatsappErr) {
      setContactStatus('error');
      setContactMsg(whatsappErr.message);
      setSavingContact(false);
      return;
    }

    if (email.trim() !== originalEmail) {
      const { error: emailErr } = await supabase.auth.updateUser({ email: email.trim() });
      if (emailErr) {
        setContactStatus('error');
        setContactMsg(emailErr.message);
        setSavingContact(false);
        return;
      }
      setContactStatus('email_pending');
      setContactMsg(
        `Um link de confirmação foi enviado para ${email.trim()}. Acesse o e-mail para concluir a alteração.`
      );
    } else {
      setContactStatus('success');
      setTimeout(() => setContactStatus(null), 3500);
    }

    setSavingContact(false);
  };

  const handleDeleteAccount = async () => {
    if (isDemo) { showDemoBlock(); return; }
    setDeleting(true);
    setDeleteError('');

    const { error } = await supabase.rpc('delete_user');
    if (error) {
      setDeleteError(error.message);
      setDeleting(false);
    } else {
      await supabase.auth.signOut({ scope: 'global' });
      onLogout();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-28 lg:pt-10 pb-24 md:pb-10 space-y-8">

      <div>
        <h1 className="font-heading font-bold text-2xl text-gray-900 dark:text-white">Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie suas informações pessoais e de contato.</p>
      </div>

      {/* ── Informações Pessoais ── */}
      <Card>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            <h2 className="font-heading font-semibold text-gray-900 dark:text-white text-base">Informações Pessoais</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Data de Nascimento
            </label>
            <input
              type="date"
              value={dataNascimento}
              onChange={e => setDataNascimento(e.target.value)}
              className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors dark:[color-scheme:dark]"
            />
          </div>

          <AnimatePresence>
            {saveStatus === 'success' && (
              <motion.div key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-xs"
              >
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Alterações salvas com sucesso!
              </motion.div>
            )}
            {saveStatus === 'error' && (
              <motion.div key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-accent text-xs p-3 bg-accent/10 rounded-lg"
              >
                Erro ao salvar: {saveMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando…' : 'Salvar Alterações'}
          </motion.button>
        </div>
      </Card>

      {/* ── Informações de Contato ── */}
      <Card>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent" />
            <h2 className="font-heading font-semibold text-gray-900 dark:text-white text-base">Informações de Contato</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
            <p className="text-gray-500 text-xs mt-1.5">
              Ao alterar, um link de confirmação será enviado para o novo endereço.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              WhatsApp
            </label>
            <div className="flex gap-2">
              {/* Seletor de país */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryMenu(v => !v)}
                  className="group flex items-center gap-0 bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden hover:border-accent/60 transition-colors h-full"
                >
                  {/* Bloco da bandeira */}
                  <span className="flex items-center justify-center px-3 py-2.5 text-xl leading-none border-r border-gray-200 dark:border-dark-border group-hover:border-accent/30 transition-colors">
                    {country.flag}
                  </span>
                  {/* Código + chevron */}
                  <span className="flex items-center gap-1 px-2.5">
                    <span className="text-gray-900 dark:text-white text-xs font-semibold tracking-wide">{country.code}</span>
                    <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                  </span>
                </button>

                <AnimatePresence>
                  {showCountryMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCountryMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -4 }}
                        transition={{ duration: 0.13, ease: 'easeOut' }}
                        className="absolute top-full left-0 mt-1.5 z-50 bg-dark-surface border border-dark-border rounded-xl shadow-2xl overflow-hidden w-56"
                      >
                        {COUNTRIES.map(c => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCountry(c);
                              setWhatsappLocal('');
                              setShowCountryMenu(false);
                            }}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left hover:bg-dark-bg transition-colors ${c.code === country.code ? 'bg-accent/5' : ''}`}
                          >
                            <span className="text-xl leading-none shrink-0">{c.flag}</span>
                            <span className={`flex-1 ${c.code === country.code ? 'text-accent font-medium' : 'text-white'}`}>
                              {c.name}
                            </span>
                            <span className="text-gray-500 text-xs font-mono">{c.code}</span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Input do número */}
              <div className="relative flex-1">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="tel"
                  value={whatsappLocal}
                  onChange={e => setWhatsappLocal(formatPhoneLocal(e.target.value, country.code))}
                  placeholder={country.code === '+55' ? '(61) 99830-1503' : 'Número local'}
                  className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {contactStatus === 'success' && (
              <motion.div key="c-ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-xs"
              >
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Contato salvo com sucesso!
              </motion.div>
            )}
            {contactStatus === 'email_pending' && (
              <motion.div key="c-pending" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2 text-xs p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300"
              >
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {contactMsg}
              </motion.div>
            )}
            {contactStatus === 'error' && (
              <motion.div key="c-err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-accent text-xs p-3 bg-accent/10 rounded-lg"
              >
                Erro: {contactMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveContact}
            disabled={savingContact}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {savingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingContact ? 'Salvando…' : 'Salvar Contato'}
          </motion.button>
        </div>
      </Card>

      {/* ── Zona de Perigo ── */}
      <Card withAccent={false} className="border-accent/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-accent" />
            <h2 className="font-heading font-semibold text-accent text-base">Zona de Perigo</h2>
          </div>
          <p className="text-gray-500 text-xs mb-6 leading-relaxed">
            Ações permanentes que não podem ser desfeitas. Tenha certeza antes de continuar.
          </p>

          <div className="flex items-center justify-between gap-4 border border-accent/20 bg-accent/5 rounded-xl p-4">
            <div>
              <p className="text-gray-900 dark:text-white text-sm font-semibold">Excluir Conta</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Remove permanentemente sua conta e todos os seus dados.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="shrink-0 px-4 py-2 text-sm font-semibold text-accent border border-accent/40 rounded-lg hover:bg-accent/15 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </Card>

      {/* ── Modal de confirmação ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
          >
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-dark-surface border border-accent/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-accent/10"
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-accent" />
              </div>

              <h3 className="font-heading font-bold text-white text-lg mb-2">Excluir conta?</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Essa ação é <strong className="text-white">permanente e irreversível</strong>. Todos os seus dados,
                configurações e histórico serão removidos e não poderão ser recuperados.
              </p>

              {deleteError && (
                <p className="text-accent text-xs mb-4 p-3 bg-accent/10 rounded-lg break-words">
                  {deleteError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                  disabled={deleting}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-400 border border-dark-border rounded-lg hover:text-white hover:border-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-accent hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
                >
                  {deleting ? 'Excluindo…' : 'Sim, excluir'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
