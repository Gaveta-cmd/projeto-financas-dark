import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Palette, Monitor, Sun, Moon, Check } from 'lucide-react';

const PREF_SOUND_KEY = 'vf_sound_effects';

const THEMES = [
  { id: 'dark',  label: 'Escuro',     icon: Moon,    desc: 'Interface escura'            },
  { id: 'light', label: 'Claro',      icon: Sun,     desc: 'Interface clara'             },
  { id: 'auto',  label: 'Automático', icon: Monitor, desc: 'Segue o sistema operacional' },
];

export function Preferences({ theme, onThemeChange }) {
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem(PREF_SOUND_KEY) !== 'false'
  );

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem(PREF_SOUND_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg px-4 pt-28 lg:pt-12 pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            Preferências
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Personalize sua experiência no VibeFinance.
          </p>
        </div>

        {/* ── Som ── */}
        <section className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Volume2 className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Som</h2>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Efeitos Sonoros
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Reproduzir sons ao receber notificações, alertas de conta e outros eventos.
              </p>
            </div>

            <button
              onClick={toggleSound}
              aria-pressed={soundEnabled}
              aria-label="Alternar efeitos sonoros"
              className={`relative flex-shrink-0 mt-0.5 w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                soundEnabled ? 'bg-accent' : 'bg-gray-200 dark:bg-zinc-700'
              }`}
            >
              <motion.span
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                animate={{ left: soundEnabled ? '1.375rem' : '0.25rem' }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            </button>
          </div>
        </section>

        {/* ── Aparência ── */}
        <section className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Aparência
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            O modo Automático detecta a preferência do Windows ou macOS.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(({ id, label, icon: Icon, desc }) => {
              const active = theme === id;
              return (
                <button
                  key={id}
                  onClick={() => onThemeChange(id)}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-xl border text-center transition-all duration-150 ${
                    active
                      ? 'bg-accent/10 border-accent/40'
                      : 'border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                  <Icon
                    className={`w-5 h-5 ${
                      active ? 'text-accent' : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold leading-tight ${
                      active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-xs text-gray-400 leading-tight">{desc}</span>
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
