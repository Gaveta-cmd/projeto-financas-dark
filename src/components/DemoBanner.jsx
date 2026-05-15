import { motion } from 'framer-motion';
import { FlaskConical, UserPlus } from 'lucide-react';

export function DemoBanner({ onExitDemo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-[45] flex items-center justify-between gap-3 px-4 py-2 bg-[#18181b] border-b border-accent/40 text-xs"
    >
      <div className="flex items-center gap-2 text-gray-400 min-w-0">
        <FlaskConical className="w-3.5 h-3.5 text-accent shrink-0" />
        <span className="truncate">
          Você está no <span className="text-white font-semibold">modo demonstração</span> — os dados são fictícios
        </span>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onExitDemo}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-colors shrink-0 shadow-[0_0_12px_#ef233c40]"
      >
        <UserPlus className="w-3 h-3" />
        Criar conta grátis
      </motion.button>
    </motion.div>
  );
}
