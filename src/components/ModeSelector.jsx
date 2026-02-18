import { motion } from "framer-motion";
import { BrainCircuit, Flame, HeartHandshake, Zap } from "lucide-react";

const modeIcon = {
  brutal_honesto: Flame,
  modo_terapeuta: HeartHandshake,
  sin_filtros: Zap,
  frio_analitico: BrainCircuit,
};

function ModeSelector({ modes, selectedId, onSelect }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {modes.map((mode) => {
        const selected = mode.id === selectedId;
        const Icon = modeIcon[mode.id] || BrainCircuit;

        return (
          <motion.button
            key={mode.id}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(mode.id)}
            className={`glass rounded-2xl border p-4 text-left transition ${
              selected
                ? "border-cyan-300/70 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(0,209,255,0.35)]"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${selected ? "text-cyan-300" : "text-white/60"}`} />
              <p className={`text-sm font-semibold ${selected ? "text-white" : "text-white/85"}`}>{mode.name}</p>
            </div>
            <p className="mt-2 text-xs text-white/65">{mode.description}</p>
          </motion.button>
        );
      })}
    </div>
  );
}

export default ModeSelector;
