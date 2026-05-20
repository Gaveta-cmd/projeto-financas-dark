import { motion } from 'framer-motion';
import { Wallet, TrendingUp, CreditCard, Bell, Shield, DollarSign } from 'lucide-react';

/* ── Float + hover wrapper ── */
function PhoneWrapper({ children, isMain = false, delay = 0, defaultOpacity = 1, className = '', style = {} }) {
  const hoverY     = isMain ? -25 : -20;
  const hoverScale = isMain ? 1.08 : 1.05;
  const hoverShadow = isMain
    ? '0 0 60px rgba(239,35,60,0.35), 0 20px 80px rgba(0,0,0,0.5)'
    : '0 20px 60px rgba(239,35,60,0.2), 0 8px 30px rgba(0,0,0,0.3)';

  return (
    <motion.div
      className={className}
      style={{ opacity: defaultOpacity, ...style }}
      animate={{ y: [0, -12, 0] }}
      transition={{
        y: { duration: 3, ease: 'easeInOut', repeat: Infinity, delay },
      }}
      whileHover={{
        y: hoverY,
        scale: hoverScale,
        opacity: 1,
        boxShadow: hoverShadow,
        transition: { duration: 0.4, ease: 'easeOut' },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Side phone mockup ── */
function PhoneSide() {
  return (
    <div className="w-[160px] h-[320px] rounded-[28px] border-2 border-[#27272a] bg-[#18181b] overflow-hidden shadow-xl">
      <div className="h-7 bg-[#27272a]/50 flex items-center justify-between px-3 text-[9px] text-gray-500">
        <span>9:41</span>
        <div className="w-12 h-2.5 bg-[#27272a] rounded-full" />
        <span>100%</span>
      </div>
      <div className="p-2.5 space-y-2">
        <div className="h-7 bg-accent/10 rounded-lg flex items-center px-2 gap-1.5">
          <Wallet className="w-3 h-3 text-accent shrink-0" />
          <div className="flex-1 h-1.5 bg-accent/20 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[['bg-accent/20'], ['bg-green-500/20']].map(([bg], i) => (
            <div key={i} className="h-12 bg-[#27272a]/50 rounded-lg p-1.5">
              <div className={`w-4 h-4 ${bg} rounded mb-1`} />
              <div className="h-1.5 w-full bg-[#27272a] rounded mb-1" />
              <div className="h-1.5 w-2/3 bg-[#27272a] rounded" />
            </div>
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-7 bg-[#27272a]/30 rounded-lg flex items-center px-2 gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#27272a] shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-3/4 bg-[#27272a] rounded" />
              <div className="h-1.5 w-1/2 bg-[#27272a]/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Center phone mockup (main, with border-spin-gradient) ── */
function PhoneCenter() {
  const transactions = [
    { Icon: CreditCard, label: 'Mercado', value: '-R$ 234',   color: 'text-red-400' },
    { Icon: DollarSign, label: 'Salário',  value: '+R$ 5.000', color: 'text-green-400' },
    { Icon: Bell,       label: 'Spotify',  value: '-R$ 21',    color: 'text-red-400' },
  ];

  return (
    <div className="border-spin-gradient rounded-[36px] p-[1px]">
      <div className="w-[200px] h-[400px] rounded-[35px] bg-[#18181b] overflow-hidden relative">
        <div className="h-8 bg-[#27272a]/40 flex items-center justify-between px-4 text-[10px] text-gray-400">
          <span>9:41</span>
          <div className="w-14 h-2.5 bg-[#27272a] rounded-full" />
          <span>100%</span>
        </div>
        <div className="px-3 pt-2 pb-0">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-white text-[11px] font-bold font-heading">VibeFinance</span>
            <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-accent/60" />
            </div>
          </div>
          <div className="bg-accent/10 border border-accent/25 rounded-2xl p-3 mb-3">
            <p className="text-[9px] text-gray-400 mb-0.5">Saldo Total</p>
            <p className="text-[18px] font-black font-heading text-white leading-tight">R$ 8.432,50</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-[9px] text-green-400 font-medium">+12,5% este mês</span>
            </div>
          </div>
          <div className="flex items-end gap-[3px] h-10 mb-3 px-1">
            {[40, 65, 45, 80, 55, 92, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: i === 5 ? '#ef233c' : i === 3 ? '#ef233c80' : '#27272a',
                }}
              />
            ))}
          </div>
          <div className="space-y-0">
            {transactions.map(({ Icon, label, value, color }, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#27272a]/40 last:border-0">
                <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center text-accent shrink-0">
                  <Icon className="w-3 h-3" />
                </div>
                <span className="flex-1 text-[9px] text-gray-300">{label}</span>
                <span className={`text-[9px] font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#27272a]/20 border-t border-[#27272a]/40 flex items-center justify-around px-2">
          {[Wallet, TrendingUp, Bell, Shield].map((Icon, i) => (
            <div key={i} className={`p-1.5 rounded-lg ${i === 0 ? 'bg-accent/15 text-accent' : 'text-gray-600'}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Hero Section ── */
export function LandingHero({ onGetStarted, onDemo }) {
  return (
    <section id="hero" className="min-h-screen bg-black flex items-center pt-16 overflow-hidden relative">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/3 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 py-16 lg:py-24">

          {/* Left: Copy */}
          <div className="flex-1 text-center lg:text-left animate-fade-in-slide">
            <div className="inline-flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
              <span className="text-gray-300 text-sm font-medium">Controle financeiro do futuro</span>
            </div>

            <h1
              className="font-heading font-black text-white mb-5 leading-[1.08] tracking-tight"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)' }}
            >
              Gerencie suas{' '}
              <span className="text-accent">finanças</span>
              {' '}com inteligência
            </h1>

            <p className="text-gray-200 text-lg mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Rastreie gastos, defina metas e alcance sua independência financeira. Offline-first, 100% responsivo e com relatórios PDF automáticos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={onGetStarted}
                className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-3.5 rounded-[10px] transition-all duration-200 hover:shadow-xl hover:shadow-accent/30 hover-shimmer text-[15px]"
              >
                Começar Grátis
              </button>
              <button
                onClick={onDemo}
                className="btn-connect"
                style={{ padding: '14px 32px', fontSize: '15px' }}
              >
                Ver Demo
              </button>
            </div>

            <div className="flex items-center gap-4 mt-8 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {['bg-accent', 'bg-purple-500', 'bg-blue-500', 'bg-green-500'].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-black`} />
                ))}
              </div>
              <p className="text-gray-400 text-sm">
                <span className="text-white font-semibold">+1.200</span> usuários ativos
              </p>
            </div>
          </div>

          {/* Right: Phone mockups */}
          <div className="flex-1 flex justify-center items-center">
            {/* Mobile: center only */}
            <PhoneWrapper delay={0.5} className="lg:hidden">
              <PhoneCenter />
            </PhoneWrapper>

            {/* Desktop: 3 phones */}
            <div className="hidden lg:flex relative items-center justify-center w-full max-w-md h-[460px]">
              {/* Left phone */}
              <PhoneWrapper
                isMain={false}
                delay={1}
                defaultOpacity={0.55}
                className="absolute left-0 top-16"
              >
                <PhoneSide />
              </PhoneWrapper>

              {/* Center phone */}
              <PhoneWrapper
                isMain={true}
                delay={0.5}
                className="relative z-10"
              >
                <PhoneCenter />
              </PhoneWrapper>

              {/* Right phone */}
              <PhoneWrapper
                isMain={false}
                delay={0}
                defaultOpacity={0.55}
                className="absolute right-0 top-16"
              >
                <PhoneSide />
              </PhoneWrapper>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
