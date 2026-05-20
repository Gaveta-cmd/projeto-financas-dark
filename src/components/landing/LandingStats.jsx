const STATS = [
  { value: '50%',  label: 'Roadmap Completo',        sub: 'Features entregues' },
  { value: '6',    label: 'Features Implementadas',   sub: 'Prontas para uso' },
  { value: '2',    label: 'Próximas Features',        sub: 'Em desenvolvimento' },
  { value: '100%', label: 'Responsivo',               sub: 'Mobile, tablet, desktop' },
];

function StatCard({ value, label, sub }) {
  return (
    <div className="group bg-[#18181b] border border-[#27272a] rounded-xl p-6 text-center hover:-translate-y-[3px] hover:border-accent/30 transition-all duration-300">
      <div
        className="font-heading font-black bg-gradient-to-r from-accent to-gray-200 bg-clip-text text-transparent leading-none mb-3"
        style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
      >
        {value}
      </div>
      <p className="text-white font-semibold text-[15px] mb-1">{label}</p>
      <p className="text-gray-500 text-xs">{sub}</p>
    </div>
  );
}

export function LandingStats() {
  return (
    <section id="stats" className="bg-[#18181b] py-20 lg:py-28 border-y border-[#27272a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-slide">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-accent mb-3">
            Números
          </span>
          <h2
            className="font-heading font-black text-white leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)' }}
          >
            Progresso em{' '}
            <span className="text-accent">tempo real</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(stat => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
