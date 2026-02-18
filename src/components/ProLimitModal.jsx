import { AnimatePresence, motion } from "framer-motion";
import { Crown, X } from "lucide-react";

function ProLimitModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="glass w-full max-w-md rounded-3xl border border-white/20 p-5" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="pill">
                <Crown className="h-3.5 w-3.5 text-cyan-300" />
                Plan Pro
              </p>
              <button type="button" onClick={onClose} className="rounded-full border border-white/20 bg-white/5 p-1.5 text-white/70 hover:text-white" aria-label="Cerrar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-white">Limite diario alcanzado</h3>
            <p className="mt-2 text-sm text-white/75">
              En plan gratis tienes 3 analisis por dia. Con Pro obtienes analisis ilimitados, historial completo e insights mas profundos.
            </p>
            <div className="mt-4 space-y-2 text-xs text-white/70">
              <p>• Analisis ilimitados</p>
              <p>• Historial completo</p>
              <p>• Insights premium</p>
            </div>
            <button type="button" onClick={onClose} className="cta-primary glow-hover mt-5 w-full rounded-2xl px-4 py-2 text-sm font-semibold text-white">
              Entendido
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default ProLimitModal;
