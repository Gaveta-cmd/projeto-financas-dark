import { useState, useEffect } from 'react';
import { Menu, X, Wallet } from 'lucide-react';

function scrollTo(href) {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function LandingNav({ onLogin, onGetStarted }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home',          href: '#hero' },
    { label: 'Features',      href: '#features' },
    { label: 'Como Funciona', href: '#stats' },
    { label: 'Download',      href: '#cta' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/95 backdrop-blur-md border-b border-[#27272a]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => { e.preventDefault(); scrollTo('#hero'); }}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-white text-lg tracking-tight">
              VibeFinance
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onLogin}
              className="btn-connect"
              style={{ padding: '8px 20px', fontSize: '14px' }}
            >
              Entrar
            </button>
            <button
              onClick={onGetStarted}
              className="bg-accent hover:bg-accent/90 text-white font-semibold text-sm px-5 py-2 rounded-[10px] transition-all duration-200 hover:shadow-lg hover:shadow-accent/25 hover-shimmer"
            >
              Começar Grátis
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Abrir menu"
            className="md:hidden text-gray-400 hover:text-white transition-colors p-1"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/98 backdrop-blur-md border-b border-[#27272a]">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  // Small delay so the menu closes before scrolling
                  setTimeout(() => scrollTo(link.href), 100);
                }}
                className="block text-gray-300 hover:text-white text-sm font-medium py-2.5 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-[#27272a] flex flex-col gap-2">
              <button
                onClick={() => { setMenuOpen(false); onLogin(); }}
                className="btn-connect w-full justify-center"
                style={{ padding: '10px 24px', fontSize: '14px' }}
              >
                Entrar
              </button>
              <button
                onClick={() => { setMenuOpen(false); onGetStarted(); }}
                className="w-full bg-accent hover:bg-accent/90 text-white font-semibold text-sm px-5 py-2.5 rounded-[10px] transition-all duration-200"
              >
                Começar Grátis
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
