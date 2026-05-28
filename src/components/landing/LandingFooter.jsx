import { Wallet } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Produto',
    links: ['Features', 'Como Funciona', 'Changelog', 'Roadmap'],
  },
  {
    title: 'Empresa',
    links: ['Sobre', 'Blog', 'Carreiras', 'Contato'],
  },
  {
    title: 'Legal',
    links: ['Privacidade', 'Termos de Uso', 'Cookies'],
  },
  {
    title: 'Social',
    links: ['Twitter / X', 'GitHub', 'LinkedIn', 'Instagram'],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-black border-t border-[#27272a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-white text-lg tracking-tight">
                VibeFinance
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Controle financeiro inteligente, offline-first e sempre responsivo.
            </p>
          </div>

          {/* Columns */}
          {COLUMNS.map(col => (
            <div key={col.title}>
              <h3 className="text-white font-semibold text-sm mb-4 font-heading">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      onClick={e => e.preventDefault()}
                      className="text-gray-200 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} VibeFinance. Todos os direitos reservados.
          </p>
          <p className="text-gray-400 text-xs">
            Feito com ♥ no Brasil
          </p>
        </div>
      </div>
    </footer>
  );
}
