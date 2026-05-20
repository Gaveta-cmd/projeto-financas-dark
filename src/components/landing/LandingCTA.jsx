import { Smartphone, Apple } from 'lucide-react';

export function LandingCTA({ onGetStarted }) {
  return (
    <section
      id="cta"
      className="bg-black py-24 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(239,35,60,0.08) 0%, transparent 65%), #000000',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Badge */}
        <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-accent mb-4">
          Comece agora
        </span>

        {/* Title */}
        <h2
          className="font-heading font-black text-white mb-5 leading-tight"
          style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)' }}
        >
          Sua vida financeira,{' '}
          <span className="text-accent">transformada</span>
        </h2>

        {/* Subtitle */}
        <p className="text-gray-200 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
          Crie sua conta gratuitamente e comece a tomar o controle do seu dinheiro ainda hoje. Sem cartão de crédito.
        </p>

        {/* Primary CTA */}
        <button
          onClick={onGetStarted}
          className="bg-accent hover:bg-accent/90 text-white font-bold px-10 py-4 rounded-[10px] transition-all duration-200 hover:shadow-2xl hover:shadow-accent/30 hover-shimmer text-base mb-10"
        >
          Começar Grátis
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[#27272a]" />
          <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">ou baixe o app</span>
          <div className="flex-1 h-px bg-[#27272a]" />
        </div>

        {/* App Badges */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="flex items-center gap-3 bg-[#18181b] border border-[#27272a] hover:border-accent/40 rounded-xl px-5 py-3.5 transition-all duration-200 hover:-translate-y-0.5 group"
            aria-label="App Store"
          >
            <Apple className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
            <div className="text-left">
              <p className="text-[10px] text-gray-500 leading-none mb-0.5">Disponível na</p>
              <p className="text-sm font-semibold text-white">App Store</p>
            </div>
          </button>

          <button
            className="flex items-center gap-3 bg-[#18181b] border border-[#27272a] hover:border-accent/40 rounded-xl px-5 py-3.5 transition-all duration-200 hover:-translate-y-0.5 group"
            aria-label="Google Play"
          >
            <Smartphone className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
            <div className="text-left">
              <p className="text-[10px] text-gray-500 leading-none mb-0.5">Disponível no</p>
              <p className="text-sm font-semibold text-white">Google Play</p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
