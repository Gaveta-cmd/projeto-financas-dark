import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Service Worker Push Tests ─────────────────────────────────────────────────
//
// Service workers run in a different global context (ServiceWorkerGlobalScope).
// jsdom doesn't support them natively. We test the push-handler logic by
// extracting it from the SW file and exercising it with a mocked `self`.
//
// The logic under test:
//   - push event → showNotification(title, { body, icon, badge, tag })
//   - notificationclick event → focus existing window OR open new window
// ─────────────────────────────────────────────────────────────────────────────

// ── Pure handler functions (extracted for testability) ────────────────────────

function handlePush(self, event) {
  let payload = { title: 'VibeFinance', body: 'Nova notificação', icon: '/icon-192x192.png' };
  try { payload = { ...payload, ...event.data.json() }; } catch { /* keep defaults */ }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:   payload.body,
      icon:   payload.icon || '/icon-192x192.png',
      badge:  '/icon-192x192.png',
      tag:    'vibefinance-notification',
    })
  );
}

async function handleNotificationClick(self, event) {
  event.notification.close();
  const windows = await self.clients.matchAll({ type: 'window' });
  if (windows.length > 0) {
    return windows[0].focus();
  }
  return self.clients.openWindow('/');
}

// ── Mocked SW context ─────────────────────────────────────────────────────────

function makeSwContext() {
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const focus = vi.fn();
  const openWindow = vi.fn();

  return {
    self: {
      registration: { showNotification },
      clients: {
        matchAll: vi.fn(),
        openWindow,
      },
    },
    showNotification,
    focus,
    openWindow,
  };
}

function makeEvent(data = {}) {
  const waitUntil = vi.fn((p) => p);
  return { ...data, waitUntil };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Service Worker — push event', () => {
  it('deve exibir notificação com title, body e icon do payload', () => {
    const ctx = makeSwContext();
    const event = makeEvent({
      data: { json: () => ({ title: 'Netflix', body: 'Vence amanhã', icon: '/icon.png' }) },
    });

    handlePush(ctx.self, event);

    expect(ctx.showNotification).toHaveBeenCalledWith('Netflix', {
      body:   'Vence amanhã',
      icon:   '/icon.png',
      badge:  '/icon-192x192.png',
      tag:    'vibefinance-notification',
    });
    expect(event.waitUntil).toHaveBeenCalled();
  });

  it('deve usar ícone padrão se payload não enviar icon', () => {
    const ctx = makeSwContext();
    const event = makeEvent({
      data: { json: () => ({ title: 'Parcela', body: 'Vence hoje' }) },
    });

    handlePush(ctx.self, event);

    expect(ctx.showNotification).toHaveBeenCalledWith('Parcela', expect.objectContaining({
      icon: '/icon-192x192.png',
    }));
  });

  it('deve usar valores padrão se evento push não tiver dados', () => {
    const ctx = makeSwContext();
    const event = makeEvent({ data: { json: () => { throw new Error(); } } });

    handlePush(ctx.self, event);

    expect(ctx.showNotification).toHaveBeenCalledWith('VibeFinance', expect.objectContaining({
      body: 'Nova notificação',
    }));
  });

  it('deve chamar waitUntil com a promise de showNotification', () => {
    const ctx = makeSwContext();
    const event = makeEvent({
      data: { json: () => ({ title: 'T', body: 'B' }) },
    });

    handlePush(ctx.self, event);

    expect(event.waitUntil).toHaveBeenCalledWith(expect.any(Promise));
  });
});

describe('Service Worker — notificationclick event', () => {
  it('deve fechar a notificação ao clicar', async () => {
    const ctx = makeSwContext();
    const close = vi.fn();
    ctx.self.clients.matchAll.mockResolvedValue([{ focus: vi.fn() }]);
    const event = makeEvent({ notification: { close } });

    await handleNotificationClick(ctx.self, event);

    expect(close).toHaveBeenCalled();
  });

  it('deve dar foco à janela existente se app já estiver aberto', async () => {
    const ctx = makeSwContext();
    const focus = vi.fn();
    ctx.self.clients.matchAll.mockResolvedValue([{ focus }]);
    const event = makeEvent({ notification: { close: vi.fn() } });

    await handleNotificationClick(ctx.self, event);

    expect(focus).toHaveBeenCalled();
    expect(ctx.openWindow).not.toHaveBeenCalled();
  });

  it('deve abrir nova janela se app estiver fechado', async () => {
    const ctx = makeSwContext();
    ctx.self.clients.matchAll.mockResolvedValue([]);
    const event = makeEvent({ notification: { close: vi.fn() } });

    await handleNotificationClick(ctx.self, event);

    expect(ctx.openWindow).toHaveBeenCalledWith('/');
  });
});
