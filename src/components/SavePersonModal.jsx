import { AnimatePresence, motion } from "framer-motion";
import { Loader2, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

function SavePersonModal({ open, onClose, onSave, loading, error }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave(name);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass w-full max-w-md rounded-3xl border border-white/20 p-5"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300">Guardar esta persona</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Mira como evoluciona esta historia...</h3>
                <p className="mt-1 text-xs text-white/65">Algunas verdades cambian con el tiempo.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 bg-white/5 p-1.5 text-white/70 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-xs font-medium text-white/70" htmlFor="person-name">
                Nombre de la persona
              </label>
              <input
                id="person-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: Maria Tinder"
                maxLength={60}
                className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
              />

              {error ? <p className="text-xs text-[#FF4D6D]">{error}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="cta-primary glow-hover inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default SavePersonModal;
