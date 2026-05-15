import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, UserPlus, X } from 'lucide-react';

export function DemoBlockModal({ visible, onClose, onCreateAccount }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="demo-block-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="bg-[#18181b] border border-accent/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-accent/10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <FlaskConical className="w-6 h-6 text-accent" />
            </div>

            <h3 className="font-heading font-bold text-white text-lg mb-2 tracking-tight">
              Modo demonstração
            </h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              No modo demo os dados são apenas para visualização.
              Crie sua conta grátis para usar de verdade!
            </p>

            <div className="flex flex-col gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onCreateAccount}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-bold transition-colors shadow-[0_0_20px_#ef233c30]"
              >
                <UserPlus className="w-4 h-4" />
                Criar conta grátis
              </motion.button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                Continuar explorando
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
