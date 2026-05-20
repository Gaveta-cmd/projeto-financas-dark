const ITEMS = [
  '50% Roadmap Completo',
  '6 Features Implementadas',
  '2 Features em Breve',
  'Offline-First',
  '100% Responsivo',
  'PWA Instalável',
  'Relatórios PDF',
  'Onboarding Inteligente',
];

export function LandingTicker() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="bg-[#18181b] border-y border-[#27272a] py-3 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 px-6 text-sm font-medium text-gray-300">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
