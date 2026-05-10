import { Repeat } from 'lucide-react';
import { EmptyTab } from './EmptyTab';

export function SubscriptionsTab() {
  return (
    <EmptyTab
      icon={Repeat}
      title="Assinaturas"
      description="Em breve você poderá cadastrar suas assinaturas recorrentes (Netflix, Spotify, academia…) e ver quanto está comprometido todo mês."
    />
  );
}
