import { motion } from "framer-motion";

const SAMPLE_CHAT = `A: Hola, como estas?
B: Bien, despues te escribo.
A: Han pasado 3 dias, todo bien?
B: Estas exagerando, solo estaba ocupada.
A: Siento que te alejas cuando hablamos de nosotros.
B: No se, tal vez estoy confundida.`;

function ChatInput({ value, onChange, onSubmit, loading, error }) {
  const chars = value.length;

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label htmlFor="chat-input" className="block text-sm font-medium text-white/85">
          Pega el chat que no te deja dormir
        </label>
        <span className="pill">Privado por sesion</span>
      </div>
      <textarea
        id="chat-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={SAMPLE_CHAT}
        className="native-input h-60 w-full rounded-2xl border border-white/15 bg-black/40 p-4 text-sm text-white placeholder:text-white/40 focus:border-cyan-300 focus:outline-none sm:h-64"
      />

      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
        <span>Caracteres: {chars}</span>
        {error ? <span className="font-medium text-[#FF4D6D]">{error}</span> : <span>Mientras mas contexto, mas verdad</span>}
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.02 }}
        disabled={loading || chars < 20}
        onClick={onSubmit}
        className="cta-primary native-tap mt-5 w-full rounded-2xl px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Descifrando señales ocultas..." : "Revelar lo que oculta este chat"}
      </motion.button>
    </div>
  );
}

export default ChatInput;
