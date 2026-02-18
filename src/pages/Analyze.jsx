import { motion } from "framer-motion";
import { Clock3, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalysisModeConfig } from "../../shared/analysisModes";
import AnalysisLoader from "../components/AnalysisLoader";
import ChatInput from "../components/ChatInput";
import ModeSelector from "../components/ModeSelector";
import ProLimitModal from "../components/ProLimitModal";
import { useAuth } from "../context/AuthContext";
import { useAnalysisMode } from "../context/AnalysisModeContext";
import { useAnalysis } from "../hooks/useAnalysis";

function Analyze() {
  const [chatText, setChatText] = useState("");
  const [storeFullText, setStoreFullText] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, quota, plan, refreshPlanAndQuota } = useAuth();
  const { modeId, setModeId, modes, selectedMode } = useAnalysisMode();
  const { runAnalysis, loading, error, history } = useAnalysis();

  const onAnalyze = async () => {
    if (!chatText.trim()) return;

    try {
      const output = await runAnalysis(chatText.trim(), { storeFullText, modeId });
      await refreshPlanAndQuota();
      navigate(`/result/${output.id}`, {
        state: { analysis: output, text: chatText.trim() },
      });
    } catch (runError) {
      if (String(runError?.message || "").includes("limite gratis")) {
        setShowProModal(true);
      }
      // Error is handled by the hook state.
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:mb-8 sm:p-6">
        <div className="pill mb-3">
          <Wand2 className="h-3.5 w-3.5 text-cyan-300" />
          Lectura emocional que incomoda (y aclara)
        </div>
        <h1 className="display-font text-2xl font-extrabold sm:text-4xl">Tu chat habla. La IA lo traduce.</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          Descubre si hay interés real o solo migajas emocionales. Obtén un veredicto directo, incómodo y compartible.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="pill">Ghosting</span>
          <span className="pill">Gaslighting</span>
          <span className="pill">Senales mixtas</span>
          {isAuthenticated && plan === "free" ? <span className="pill">{quota?.limit == null ? "Ilimitado por ahora" : `Te quedan ${quota?.remaining ?? 0} analisis hoy`}</span> : null}
          {isAuthenticated && plan === "pro" ? <span className="pill">Plan Pro activo</span> : null}
        </div>
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/55">Elige tu personalidad IA</p>
          <ModeSelector modes={modes} selectedId={modeId} onSelect={setModeId} />
          <p className="mt-2 text-xs text-cyan-300">Modo actual: {selectedMode.name}</p>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <ChatInput value={chatText} onChange={setChatText} onSubmit={onAnalyze} loading={loading} error={error} />
          <label className="glass flex items-center gap-3 rounded-2xl p-3 text-sm text-white/80 sm:p-4">
            <input
              type="checkbox"
              checked={storeFullText}
              onChange={(event) => setStoreFullText(event.target.checked)}
              className="h-4 w-4 accent-cyan-300"
            />
            Guardar texto completo del chat (opcional). Por defecto ocultamos contenido sensible.
          </label>
          {loading && <AnalysisLoader />}
        </div>

        <aside className="glass rounded-2xl p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/85">
            <Clock3 className="h-4 w-4" />
            Ultimos descubrimientos
          </h2>
          {history.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/55">
              Aun no hay resultados. El primero suele ser el mas revelador.
            </div>
          ) : (
            <ul className="space-y-3">
              {history.slice(0, 5).map((entry, index) => (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-xl border border-white/10 bg-black/25 p-3"
                >
                  <p className="text-xs text-white/70">{entry.verdict}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-white/55">
                    <span className="pill">
                      <Sparkles className="h-3 w-3 text-cyan-300" />
                      Interes {entry.interestScore ?? entry.scores?.interestScore ?? "-"}
                    </span>
                    <span className="pill">{getAnalysisModeConfig(entry.analysisMode).name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/result/${entry.id}`)}
                    className="mt-2 text-xs font-medium text-cyan-300 hover:underline"
                  >
                    Ver resultado
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </aside>
      </div>
      <ProLimitModal open={showProModal} onClose={() => setShowProModal(false)} />
    </main>
  );
}

export default Analyze;
