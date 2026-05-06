import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Sessão fica só na memória do browser (não persiste no localStorage).
    // Efeito: o Login aparece sempre que a página é recarregada ou uma nova
    // aba é aberta. Para manter o usuário logado entre recargas, mude para true.
    persistSession: false,
  },
});
