import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Trash2, Save,
  AlertTriangle, CheckCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Card } from './Card';
import { Button } from './Button';

export function Profile({ session, onLogout }) {
  const user = session?.user;

  const [nome, setNome]                   = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [whatsapp, setWhatsapp]           = useState('');

  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saveStatus, setSaveStatus]   = useState(null); // null | 'success' | 'error'
  const [saveMsg, setSaveMsg]         = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    async function loadProfile() {
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
        setWhatsapp(data.whatsapp ?? '');
      }
      setLoading(false);
    }

    if (user?.id) loadProfile();
    else setLoading(false);
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    setSaveMsg('');

    const { error: authErr } = await supabase.auth.updateUser({
      data: { full_name: nome, birth_date: dataNascimento },
    });

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: user?.id, full_name: nome, birth_date: dataNascimento, whatsapp });

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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');

    const { error } = await supabase.rpc('delete_user');
    if (error) {
      setDeleteError(error.message);
      setDeleting(false);
    } else {
      await supabase.auth.signOut({ scope: 'local' });
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
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie suas informações pessoais e de contato.</p>
      </div>

      {/* ── Informações Pessoais ── */}
      <Card>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            <h2 className="font-heading font-semibold text-white text-base">Informações Pessoais</h2>
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
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
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
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors [color-scheme:dark]"
            />
          </div>

          <AnimatePresence>
            {saveStatus === 'success' && (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-xs"
              >
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Alterações salvas com sucesso!
              </motion.div>
            )}
            {saveStatus === 'error' && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-accent text-xs p-3 bg-accent/10 rounded-lg"
              >
                Erro ao salvar: {saveMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Salvando…' : 'Salvar Alterações'}
          </Button>
        </div>
      </Card>

      {/* ── Informações de Contato ── */}
      <Card>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent" />
            <h2 className="font-heading font-semibold text-white text-base">Informações de Contato</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                value={user?.email ?? ''}
                readOnly
                className="w-full bg-dark-bg/50 border border-dark-border rounded-lg px-4 py-2.5 text-gray-500 text-sm cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-medium uppercase tracking-wider select-none">
                somente leitura
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+55 (11) 99999-9999"
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
              />
            </div>
          </div>
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
              <p className="text-white text-sm font-semibold">Excluir Conta</p>
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
