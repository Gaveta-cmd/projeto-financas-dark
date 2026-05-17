# 🔔 Notificações In-App — Documentação

## Visão Geral
Feature que alerta usuários sobre **assinaturas** e **parcelamentos** vencendo nos próximos 7 dias, com toast flutuante e badge nas abas relevantes.

## Arquivos Criados

### 1. `src/hooks/useUpcomingNotifications.js`
**Hook customizado** que gerencia toda a lógica de detecção de vencimentos.

**Funcionalidades:**
- `useUpcomingNotifications()` — retorna `{ notifications, loading }`
- Busca subscriptions com `next_billing_date` nos próximos 7 dias
- Busca installments em aberto e calcula próximo vencimento
- Calcula dias até vencimento automaticamente
- Ordena por urgência

**Estrutura de cada notificação:**
```js
{
  id: 'sub-uuid' | 'inst-uuid',
  type: 'subscription' | 'installment',
  title: string,                     // "Assinatura vencendo: Netflix"
  date: 'YYYY-MM-DD',
  daysLeft: number,
  amount?: number,                   // Para subscriptions
  progress?: string,                 // Para installments "3/12"
}
```

### 2. `src/components/NotificationToast.jsx`
**Componente Toast** que exibe notificações no topo do dashboard.

**Props:**
- `notifications` — array de notificações
- `onDismiss` — callback quando usuário fecha uma notificação

**Features:**
- Mostra até 3 notificações mais urgentes
- Cores por urgência:
  - 🔴 Vermelho (0-2 dias)
  - 🟡 Amarelo (2-4 dias)
  - 🟢 Verde (5-7 dias)
- Cada notificação é dismissable individualmente
- Exibe contador "+X mais" se houver mais de 3
- Animações com Framer Motion
- Dark mode support

### 3. Arquivos Modificados

#### `src/components/dashboard/DashboardTabs.jsx`
- Adicionado prop `notificationCount`
- Badge com número de notificações nas abas "Assinaturas" e "Parcelamentos"
- Animação `scaleIn` quando badge aparece

#### `src/components/Dashboard.jsx`
- Importado `useUpcomingNotifications` hook
- Estado `dismissedNotifications` para gerenciar notificações fechadas
- `NotificationToast` integrado no topo
- Passa `notificationCount` ao `DashboardTabs`

## Como Funciona

### 1. Carregamento de Notificações
Quando o usuário acessa o Dashboard:
```jsx
const { notifications } = useUpcomingNotifications();
// Hook busca subscriptions + installments vencendo
// Ordena por urgência
// Retorna array
```

### 2. Exibição
```jsx
<NotificationToast notifications={visibleNotifications} />
// Toast aparece no topo com primeiras 3 notificações
```

### 3. Dismiss
Usuário clica no X → `onDismiss` é chamado → notificação é adicionada a `dismissedNotifications` → estado atualiza → notificação é filtrada do display.

### 4. Badge nas Abas
```jsx
<DashboardTabs 
  notificationCount={visibleNotifications.length}
/>
// Se > 0, mostra badge com número nas abas relevantes
```

## Lógica de Cálculo

### Subscriptions
```js
daysUntil(next_billing_date)
if (daysLeft >= 0 && daysLeft <= 6) → notifica
```

### Installments
Calcula próximo vencimento baseado em:
```js
nextPaymentDate = start_date + (paid_installments + 1) * 30 dias
daysUntil(nextPaymentDate)
if (daysLeft >= 0 && daysLeft <= 6) → notifica
```

## Testing

### Modo Demo
1. Acesse o app com dados demo
2. Toast deve aparecer no topo se houver subscriptions/installments vencendo
3. Abas mostram badge com contador

### Modo Real (com Supabase)
1. Conecte bancos para gerar dados de seed
2. Crie parcelas/assinaturas manualmente
3. Modifique `next_billing_date` / `start_date` para datas próximas
4. Recarregue → Toast deve aparecer com notificações

## Customizações Possíveis

### 1. Mudar intervalo de 7 dias
No `useUpcomingNotifications.js`, linha ~60:
```js
if (days >= 0 && days <= 6) {  // ← mudar de 6 para outro número
```

### 2. Mudar posição do Toast
No `NotificationToast.jsx`, linha ~50:
```jsx
className="fixed top-20 left-1/2 ..."  // ← customizar top/left
```

### 3. Adicionar som/notificação push
No `Dashboard.jsx`, após notificações carregarem:
```js
if (visibleNotifications.length > 0) {
  // Play sound, send push, etc.
}
```

### 4. Adicionar ação rápida (ex: "Pagar agora")
No `NotificationItem`, adicionar botão:
```jsx
<button onClick={() => onPay(notification.id)}>
  Pagar agora
</button>
```

## Performance

- ✅ Queries otimizadas com índices no Supabase
- ✅ Hook usa `useEffect` com cleanup
- ✅ `useMemo` para filtros de notificações
- ✅ Dismissals não recarregam dados
- ✅ Sem polling — carrega 1x ao entrar no Dashboard

## Integração com Features Futuras

### Notificações Push (feature #9)
Pode reutilizar dados de `useUpcomingNotifications` para enviar:
- Email via Resend
- Browser push via service worker

### Relatório Anual (feature #5)
Os dados de notificações vencidas podem alimentar relatório de "atrasos" ou "regularidade de pagamento"

---

**Status:** ✅ Pronto para produção  
**Rodmap:** Feature #3 (Notificações In-App)  
**Próxima feature recomendada:** #2 (Limites por Categoria)
