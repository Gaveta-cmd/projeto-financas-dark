import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationService } from '../useNotificationService';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}));

import { supabase } from '../../lib/supabaseClient';

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockNotificationGranted() {
  Object.defineProperty(window, 'Notification', {
    value: Object.assign(vi.fn(), { permission: 'granted' }),
    writable: true,
    configurable: true,
  });
}

function mockNotificationDenied() {
  Object.defineProperty(window, 'Notification', {
    value: Object.assign(vi.fn(), { permission: 'denied' }),
    writable: true,
    configurable: true,
  });
}

function mockNotificationDefault(resolveWith = 'granted') {
  const mockReq = vi.fn().mockResolvedValue(resolveWith);
  Object.defineProperty(window, 'Notification', {
    value: Object.assign(vi.fn(), {
      permission: 'default',
      requestPermission: mockReq,
    }),
    writable: true,
    configurable: true,
  });
  return mockReq;
}

function mockServiceWorker(showNotification = vi.fn().mockResolvedValue()) {
  const reg = { showNotification };
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { ready: Promise.resolve(reg) },
    writable: true,
    configurable: true,
  });
  return { reg, showNotification };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useNotificationService', () => {
  beforeEach(() => {
    supabase.functions.invoke.mockResolvedValue({ data: { success: true, messageId: 'msg_1' }, error: null });
    // Remove Notification from window by default (controlled per-test)
    delete window.Notification;
    delete navigator.serviceWorker;
  });

  // ── Shape ──────────────────────────────────────────────────────────────────

  it('deve retornar { sendEmail, sendPush, sendBatch, loading, error }', () => {
    const { result } = renderHook(() => useNotificationService());
    expect(typeof result.current.sendEmail).toBe('function');
    expect(typeof result.current.sendPush).toBe('function');
    expect(typeof result.current.sendBatch).toBe('function');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // ── sendEmail ──────────────────────────────────────────────────────────────

  it('sendEmail deve chamar supabase.functions.invoke com email, subject e message', async () => {
    const { result } = renderHook(() => useNotificationService());
    await act(async () => {
      await result.current.sendEmail('user@example.com', 'Netflix vencendo', 'Vence em 2 dias');
    });
    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-notification', {
      body: {
        email: 'user@example.com',
        subject: 'Netflix vencendo',
        message: 'Vence em 2 dias',
      },
    });
  });

  it('sendEmail deve rejeitar se email for inválido', async () => {
    const { result } = renderHook(() => useNotificationService());
    await expect(
      act(async () => result.current.sendEmail('nao-e-email', 'Assunto', 'Msg'))
    ).rejects.toThrow('Email inválido');
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('sendEmail deve rejeitar se email estiver vazio', async () => {
    const { result } = renderHook(() => useNotificationService());
    await expect(
      act(async () => result.current.sendEmail('', 'Assunto', 'Msg'))
    ).rejects.toThrow('Email inválido');
  });

  it('sendEmail deve aplicar rate limiting e pular chamada duplicada', async () => {
    const { result } = renderHook(() => useNotificationService());

    await act(async () => {
      await result.current.sendEmail('user@example.com', 'Netflix', 'Msg');
    });
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);

    // Segunda chamada com mesmo email+subject deve ser ignorada (rate limit)
    let secondResult;
    await act(async () => {
      secondResult = await result.current.sendEmail('user@example.com', 'Netflix', 'Msg');
    });
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    expect(secondResult).toEqual({ skipped: true, reason: 'rate_limited' });
  });

  it('sendEmail deve permitir emails diferentes sem rate limit', async () => {
    const { result } = renderHook(() => useNotificationService());
    await act(async () => {
      await result.current.sendEmail('a@example.com', 'Assunto', 'Msg');
      await result.current.sendEmail('b@example.com', 'Assunto', 'Msg');
    });
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
  });

  it('sendEmail deve relançar erro do Supabase', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: new Error('Resend indisponível'),
    });
    const { result } = renderHook(() => useNotificationService());
    await expect(
      act(async () => result.current.sendEmail('user@example.com', 'Sub', 'Msg'))
    ).rejects.toThrow('Resend indisponível');
  });

  // ── sendPush ───────────────────────────────────────────────────────────────

  it('sendPush deve retornar fallback se Notification API não disponível', async () => {
    const { result } = renderHook(() => useNotificationService());
    let pushResult;
    await act(async () => {
      pushResult = await result.current.sendPush('Título', 'Corpo');
    });
    expect(pushResult).toEqual({ fallback: 'toast', reason: 'api_unavailable' });
  });

  it('sendPush não deve forçar nova permissão se usuário negou', async () => {
    mockNotificationDenied();
    const { result } = renderHook(() => useNotificationService());
    let pushResult;
    await act(async () => {
      pushResult = await result.current.sendPush('Título', 'Corpo');
    });
    expect(pushResult).toEqual({ skipped: true, reason: 'permission_denied' });
  });

  it('sendPush deve solicitar permissão se status for "default"', async () => {
    const mockReq = mockNotificationDefault('granted');
    const { showNotification } = mockServiceWorker();

    const { result } = renderHook(() => useNotificationService());
    await act(async () => {
      await result.current.sendPush('Título', 'Corpo');
    });
    expect(mockReq).toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalledWith('Título', expect.objectContaining({ body: 'Corpo' }));
  });

  it('sendPush deve retornar skipped se usuário negar permissão no prompt', async () => {
    mockNotificationDefault('denied');
    const { result } = renderHook(() => useNotificationService());
    let pushResult;
    await act(async () => {
      pushResult = await result.current.sendPush('Título', 'Corpo');
    });
    expect(pushResult).toEqual({ skipped: true, reason: 'permission_denied' });
  });

  it('sendPush com permissão concedida deve chamar showNotification no SW', async () => {
    mockNotificationGranted();
    const { showNotification } = mockServiceWorker();
    const { result } = renderHook(() => useNotificationService());
    let pushResult;
    await act(async () => {
      pushResult = await result.current.sendPush('Netflix vencendo', 'Vence amanhã', '/icon-192x192.png');
    });
    expect(showNotification).toHaveBeenCalledWith('Netflix vencendo', {
      body: 'Vence amanhã',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'vibefinance-notification',
    });
    expect(pushResult).toEqual({ success: true });
  });

  it('sendPush deve retornar fallback se SW não disponível (mesmo com permissão)', async () => {
    mockNotificationGranted();
    // navigator.serviceWorker não está definido
    const { result } = renderHook(() => useNotificationService());
    let pushResult;
    await act(async () => {
      pushResult = await result.current.sendPush('Título', 'Corpo');
    });
    expect(pushResult.fallback).toBe('toast');
  });

  // ── sendBatch ──────────────────────────────────────────────────────────────

  it('sendBatch deve processar até 3 itens de uma vez e retornar resultados', async () => {
    const { result } = renderHook(() => useNotificationService());

    // 3 items = 1 batch = sem delay entre batches
    const items = [
      { email: 'a@x.com', subject: 'Sub', message: 'Msg' },
      { email: 'b@x.com', subject: 'Sub', message: 'Msg' },
      { email: 'c@x.com', subject: 'Sub', message: 'Msg' },
    ];

    let batchResults;
    await act(async () => { batchResults = await result.current.sendBatch(items); });

    expect(supabase.functions.invoke).toHaveBeenCalledTimes(3);
    expect(batchResults).toHaveLength(3);
    expect(batchResults.every(r => r.status === 'fulfilled')).toBe(true);
  });

  it('sendBatch deve setar loading=false e error=null após completar', async () => {
    const { result } = renderHook(() => useNotificationService());

    await act(async () => {
      await result.current.sendBatch([{ email: 'a@x.com', subject: 'S', message: 'M' }]);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
