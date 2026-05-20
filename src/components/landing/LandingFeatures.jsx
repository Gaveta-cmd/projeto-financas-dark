import { Bell, Target, BarChart3, MessageSquare, Shield, Cloud } from 'lucide-react';

const FEATURES = [
  {
    Icon: Bell,
    title: 'Notificações In-App',
    description: 'Alertas em tempo real sobre limites de gastos, vencimentos e movimentações importantes.',
    tag: 'Tempo Real',
    highlight: false,
  },
  {
    Icon: Target,
    title: 'Limites por Categoria',
    description: 'Defina limites mensais para cada categoria e receba alertas antes de estourar o orçamento.',
    tag: 'Orçamento',
    highlight: false,
  },
  {
    Icon: BarChart3,
    title: 'Relatório Anual PDF',
    description: 'Gere relatórios completos de 12 meses com gráficos, categorias e evolução patrimonial.',
    tag: 'Relatórios',
    highlight: false,
  },
  {
    Icon: MessageSquare,
    title: 'Onboarding Inteligente',
    description: 'Quiz personalizado que configura seu perfil financeiro automaticamente ao criar a conta.',
    tag: 'IA',
    highlight: true,
  },
  {
    Icon: Shield,
    title: 'Reserva de Emergência',
    description: 'Calcule e acompanhe sua reserva ideal com base nos seus gastos mensais reais.',
    tag: 'Proteção',
    highlight: false,
  },
  {
    Icon: Cloud,
    title: 'PWA Offline-First',
    description: 'Use o app sem internet. Dados sincronizados automaticamente quando a conexão voltar.',
    tag: 'Offline',
    highlight: false,
  },
];

function FeatureCard({ Icon, title, description, tag, highlight }) {
  return (
    <div
      className={`group relative rounded-xl p-6 border transition-all duration-300 cursor-default
        hover:-translate-y-1 hover:border-accent/50 hover-beam corner-accent overflow-hidden
        ${highlight
          ? 'bg-gradient-to-br from-accent/10 to-[#18181b] border-accent/30'
          : 'bg-[#18181b] border-[#27272a]'
        }`}
    >
      {/* Tag */}
      <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/25 rounded-full px-2.5 py-0.5 mb-4">
        {tag}
      </span>

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors duration-300">
        <Icon className="w-5 h-5 text-accent" strokeWidth={1.75} />
      </div>

      {/* Text */}
      <h3 className="font-heading font-bold text-white text-[15px] mb-2 leading-snug">
        {title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="bg-black py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14 animate-fade-in-slide">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-accent mb-3">
            Funcionalidades
          </span>
          <h2
            className="font-heading font-black text-white mb-4 leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)' }}
          >
            Tudo que você precisa para{' '}
            <span className="text-accent">controlar</span> seu dinheiro
          </h2>
          <p className="text-gray-400 text-base max-w-2xl mx-auto leading-relaxed">
            Seis funcionalidades poderosas projetadas para transformar sua relação com as finanças pessoais.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(feat => (
            <FeatureCard key={feat.title} {...feat} />
          ))}
        </div>
      </div>
    </section>
  );
}
