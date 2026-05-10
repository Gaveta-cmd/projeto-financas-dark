import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// Tela "em breve" reaproveitável para abas ainda não implementadas.
export function EmptyTab({ icon: Icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center text-center py-20 px-6 bg-dark-surface border border-dashed border-dark-border rounded-2xl relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] to-transparent pointer-events-none" />

      <div className="relative z-10 w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-accent" />
      </div>

      <div className="relative z-10 flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
        <Sparkles className="w-3 h-3 text-accent" />
        <span className="text-accent text-xs font-semibold uppercase tracking-wider">Em breve</span>
      </div>

      <h2 className="relative z-10 text-2xl font-heading font-bold text-white mb-2 tracking-tight">
        {title}
      </h2>
      <p className="relative z-10 text-gray-500 text-sm max-w-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
