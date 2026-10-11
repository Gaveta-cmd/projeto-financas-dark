import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../api';

function respondWith(status, payload) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  });
}

function sentBody() {
  return JSON.parse(globalThis.fetch.mock.calls[0][1].body);
}

describe('api.from', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('envia tabela, colunas, filtros e ordenação de um select', async () => {
    respondWith(200, { data: [{ id: '1', amount: 10 }] });

    const { data, error } = await api
      .from('transactions')
      .select('id, amount')
      .eq('type', 'expense')
      .gte('date', '2026-10-01')
      .order('date', { ascending: false });

    expect(error).toBeNull();
    expect(data).toEqual([{ id: '1', amount: 10 }]);
    expect(globalThis.fetch.mock.calls[0][0]).toBe('/api/db/query');
    expect(sentBody()).toMatchObject({
      table: 'transactions',
      op: 'select',
      columns: ['id', 'amount'],
      filters: [
        { column: 'type', op: 'eq', value: 'expense' },
        { column: 'date', op: 'gte', value: '2026-10-01' },
      ],
      order: [{ column: 'date', ascending: false }],
    });
  });

  it('insert sem select() não devolve linhas', async () => {
    respondWith(200, { data: [] });

    const { data, error } = await api.from('goals').insert({ name: 'Viagem' });

    expect(error).toBeNull();
    expect(data).toBeNull();
    expect(sentBody()).toMatchObject({ op: 'insert', returning: false, values: { name: 'Viagem' } });
  });

  it('insert().select().single() devolve a linha gravada', async () => {
    respondWith(200, { data: [{ id: 'g1', name: 'Viagem', color: '#fff' }] });

    const { data } = await api.from('goals').insert({ name: 'Viagem' }).select('id, name').single();

    expect(sentBody().returning).toBe(true);
    expect(data).toEqual({ id: 'g1', name: 'Viagem' });
  });

  it('single() falha quando não há linha e maybeSingle() devolve null', async () => {
    respondWith(200, { data: [] });
    const single = await api.from('profiles').select('*').eq('id', 'x').single();
    expect(single.data).toBeNull();
    expect(single.error.code).toBe('not_single_row');

    respondWith(200, { data: [] });
    const maybe = await api.from('profiles').select('*').eq('id', 'x').maybeSingle();
    expect(maybe).toEqual({ data: null, error: null });
  });

  it('upsert envia as colunas de conflito e not(is null) vira filtro próprio', async () => {
    respondWith(200, { data: [] });
    await api.from('spending_limits').upsert({ category: 'lazer' }, { onConflict: 'user_id,category' });
    expect(sentBody()).toMatchObject({ op: 'upsert', onConflict: ['user_id', 'category'] });

    respondWith(200, { data: [] });
    await api.from('transactions').select('*').not('bank_source', 'is', null);
    expect(sentBody().filters).toEqual([{ column: 'bank_source', op: 'not.is', value: null }]);
  });

  it('devolve o erro da API em vez de lançar', async () => {
    respondWith(403, { code: 'forbidden', message: 'Você não participa deste grupo familiar.' });

    const { data, error } = await api.from('cards').insert({ name: 'Nubank' });

    expect(data).toBeNull();
    expect(error).toMatchObject({ code: 'forbidden', status: 403 });
  });

  it('falha de rede vira erro, não exceção', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const { error } = await api.from('goals').select('*');

    expect(error.code).toBe('network_error');
  });
});

describe('api.auth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('login guarda a sessão, avisa os ouvintes e passa a enviar o token', async () => {
    const session = { access_token: 'tok-123', user: { id: 'u1', email: 'a@b.com' } };
    const listener = vi.fn();
    const { data: { subscription } } = api.auth.onAuthStateChange(listener);

    respondWith(200, { session });
    const { data, error } = await api.auth.signInWithPassword({ email: 'a@b.com', password: 'segredo' });

    expect(error).toBeNull();
    expect(data.session).toEqual(session);
    expect(listener).toHaveBeenCalledWith('SIGNED_IN', session);

    respondWith(200, { data: [] });
    await api.from('goals').select('*');
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-123');

    subscription.unsubscribe();
  });

  it('resposta 401 com sessão guardada derruba a sessão local', async () => {
    localStorage.setItem('vf_session', JSON.stringify({ access_token: 'velho', user: { id: 'u1' } }));
    const listener = vi.fn();
    const { data: { subscription } } = api.auth.onAuthStateChange(listener);

    respondWith(401, null);
    const { data } = await api.auth.getSession();

    expect(data.session).toBeNull();
    expect(localStorage.getItem('vf_session')).toBeNull();
    expect(listener).toHaveBeenCalledWith('SIGNED_OUT', null);

    subscription.unsubscribe();
  });

  it('credenciais erradas não criam sessão', async () => {
    respondWith(400, { code: 'bad_request', message: 'Invalid login credentials' });

    const { data, error } = await api.auth.signInWithPassword({ email: 'a@b.com', password: 'errada' });

    expect(data.session).toBeNull();
    expect(error.message).toBe('Invalid login credentials');
    expect(localStorage.getItem('vf_session')).toBeNull();
  });
});
