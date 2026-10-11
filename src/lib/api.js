// Cliente da API local (Spring Boot + MySQL).
// Toda chamada resolve em { data, error } — nunca lança — para os componentes
// tratarem falha de rede e erro de regra de negócio do mesmo jeito.

const BASE_URL    = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const SESSION_KEY = 'vf_session';

// ── Sessão ────────────────────────────────────────────────────────────────

const listeners = new Set();

function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null'); }
  catch { return null; }
}

function writeSession(session, event) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else         localStorage.removeItem(SESSION_KEY);
  listeners.forEach((listener) => listener(event, session));
}

// ── HTTP ──────────────────────────────────────────────────────────────────

async function request(path, { method = 'POST', body } = {}) {
  const token = readSession()?.access_token;
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { data: null, error: { code: 'network_error', message: 'Não foi possível conectar ao servidor.' } };
  }

  const payload = await response.json().catch(() => null);
  if (response.ok) return { data: payload, error: null };

  // Token expirado ou revogado: derruba a sessão local para o app voltar ao login.
  if (response.status === 401 && token) writeSession(null, 'SIGNED_OUT');

  return {
    data: null,
    error: {
      code:    payload?.code ?? `http_${response.status}`,
      message: payload?.message ?? 'Erro inesperado. Tente novamente.',
      status:  response.status,
    },
  };
}

// ── Consultas ─────────────────────────────────────────────────────────────

function splitColumns(columns) {
  return String(columns).split(',').map((c) => c.trim()).filter(Boolean);
}

function pick(row, columns) {
  if (!columns || columns.includes('*')) return row;
  return Object.fromEntries(columns.map((c) => [c, row[c]]));
}

// Monta uma consulta encadeável (`api.from('goals').select('*').eq('id', id)`)
// que só é enviada quando aguardada com `await`.
class Query {
  constructor(table) {
    this.body = { table, op: 'select', columns: null, filters: [], order: [], limit: null, values: null, onConflict: null, returning: false };
    this.returnColumns = null;
    this.cardinality   = 'many'; // 'many' | 'single' | 'maybeSingle'
  }

  select(columns = '*') {
    const list = splitColumns(columns);
    if (this.body.op === 'select') {
      this.body.columns = list;
    } else {
      // Depois de insert/update/upsert, select() pede as linhas gravadas de volta.
      this.body.returning = true;
      this.returnColumns  = list;
    }
    return this;
  }

  insert(values) { return this.write('insert', values); }
  update(values) { return this.write('update', values); }
  delete()       { return this.write('delete', null); }

  upsert(values, { onConflict } = {}) {
    this.body.onConflict = onConflict ? splitColumns(onConflict) : null;
    return this.write('upsert', values);
  }

  write(op, values) {
    this.body.op     = op;
    this.body.values = values;
    return this;
  }

  filter(column, op, value) {
    this.body.filters.push({ column, op, value });
    return this;
  }

  eq(column, value)    { return this.filter(column, 'eq', value); }
  neq(column, value)   { return this.filter(column, 'neq', value); }
  gt(column, value)    { return this.filter(column, 'gt', value); }
  gte(column, value)   { return this.filter(column, 'gte', value); }
  lt(column, value)    { return this.filter(column, 'lt', value); }
  lte(column, value)   { return this.filter(column, 'lte', value); }
  like(column, value)  { return this.filter(column, 'like', value); }
  ilike(column, value) { return this.filter(column, 'ilike', value); }
  in(column, values)   { return this.filter(column, 'in', values); }
  is(column)           { return this.filter(column, 'is', null); }

  // Só a negação usada no app: not(coluna, 'is', null).
  not(column, op, value) {
    if (op === 'is' && value === null) return this.filter(column, 'not.is', null);
    if (op === 'eq') return this.filter(column, 'neq', value);
    throw new Error(`Filtro não suportado: not ${op}`);
  }

  order(column, { ascending = true } = {}) {
    this.body.order.push({ column, ascending });
    return this;
  }

  limit(count) {
    this.body.limit = count;
    return this;
  }

  single()      { this.cardinality = 'single';      return this; }
  maybeSingle() { this.cardinality = 'maybeSingle'; return this; }

  async execute() {
    const { data, error } = await request('/db/query', { body: this.body });
    if (error) return { data: null, error };

    const isRead = this.body.op === 'select';
    if (!isRead && !this.body.returning) return { data: null, error: null };

    const rows = isRead ? data.data : data.data.map((row) => pick(row, this.returnColumns));
    if (this.cardinality === 'many') return { data: rows, error: null };

    if (rows.length === 1) return { data: rows[0], error: null };
    if (rows.length === 0 && this.cardinality === 'maybeSingle') return { data: null, error: null };
    return { data: null, error: { code: 'not_single_row', message: 'A consulta não retornou exatamente um registro.' } };
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

// ── Autenticação ──────────────────────────────────────────────────────────

const auth = {
  // Confere a sessão guardada com o servidor; se ele estiver fora do ar, mantém a local.
  async getSession() {
    const stored = readSession();
    if (!stored) return { data: { session: null }, error: null };

    const { data, error } = await request('/auth/user', { method: 'GET' });
    if (error?.status === 401) return { data: { session: null }, error: null };
    if (error) return { data: { session: stored }, error: null };

    const session = { ...stored, user: data.user };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { data: { session }, error: null };
  },

  async getUser() {
    const { data, error } = await request('/auth/user', { method: 'GET' });
    return { data: { user: data?.user ?? null }, error };
  },

  async signInWithPassword({ email, password }) {
    return startSession('/auth/login', { email, password });
  },

  async signUp({ email, password, options }) {
    return startSession('/auth/signup', { email, password, data: options?.data ?? {} });
  },

  async signOut() {
    if (readSession()) await request('/auth/logout');
    writeSession(null, 'SIGNED_OUT');
    return { error: null };
  },

  async updateUser(changes) {
    const { data, error } = await request('/auth/user', { method: 'PUT', body: changes });
    if (error) return { data: { user: null }, error };

    const stored = readSession();
    if (stored) writeSession({ ...stored, user: data.user }, 'USER_UPDATED');
    return { data: { user: data.user }, error: null };
  },

  onAuthStateChange(listener) {
    listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
  },
};

async function startSession(path, body) {
  const { data, error } = await request(path, { body });
  if (error) return { data: { session: null, user: null }, error };

  writeSession(data.session, 'SIGNED_IN');
  return { data: { session: data.session, user: data.session.user }, error: null };
}

// ── API pública ───────────────────────────────────────────────────────────

export const api = {
  auth,

  from(table) {
    return new Query(table);
  },

  async rpc(name, params = {}) {
    const { data, error } = await request(`/rpc/${name}`, { body: params });
    return { data: data?.data ?? null, error };
  },
};
