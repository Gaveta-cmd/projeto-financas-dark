import { CalendarClock } from 'lucide-react';
import { EmptyTab } from './EmptyTab';

export function InstallmentsTab() {
  return (
    <EmptyTab
      icon={CalendarClock}
      title="Parcelamentos"
      description="Em breve você poderá registrar compras parceladas e acompanhar quanto falta pagar, mês a mês, em um único lugar."
    />
  );
}
