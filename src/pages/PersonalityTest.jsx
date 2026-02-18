import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Download, Loader2, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProLimitModal from "../components/ProLimitModal";
import { useAuth } from "../context/AuthContext";
import { buildPersonalityShareText, createPersonalityImage, resolvePersonalityProfile } from "../features/personality-test/engine";
import { PERSONALITY_TEST } from "../features/personality-test/questions";
import { trackAnalyticsEvent } from "../services/analytics";
import { consumeDailyAnalysisQuota, savePersonalityTestResult } from "../services/firebase";
import { APP_NAME } from "../lib/appConfig";

function PersonalityTest() {
  const questions = PERSONALITY_TEST.questions;
  const navigate = useNavigate();
  const { isAuthenticated, plan, quota, refreshPlanAndQuota } = useAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showProModal, setShowProModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState("");

  const current = questions[step];
  const hasAnswer = Boolean(current && answers[current.id]);
  const isLast = step === questions.length - 1;
  const done = Object.keys(answers).length === questions.length;
  const progress = Math.round((Math.min(step + 1, questions.length) / questions.length) * 100);

  const onSelect = (optionId) => {
    setAnswers((prev) => ({ ...prev, [current.id]: optionId }));
  };

  const onAnalyze = async () => {
    if (!done) return;
    setLoading(true);
    setFeedback("");

    const output = resolvePersonalityProfile(answers, questions);
    setResult(output.profile);
    setLoading(false);

    trackAnalyticsEvent("personality_test_completed", {
      profile_id: output.profile.id,
    });

    const withTimeout = (promise, ms = 7000) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
      ]);

    try {
      if (isAuthenticated && plan === "free") {
        await withTimeout(consumeDailyAnalysisQuota(), 7000);
      }

      if (isAuthenticated) {
        await withTimeout(
          savePersonalityTestResult({
            testId: PERSONALITY_TEST.id,
            answers,
            result: output.profile,
          }),
          7000,
        );
        await withTimeout(refreshPlanAndQuota(), 7000);
      }
    } catch (error) {
      const message = String(error?.message || "");
      if (message.includes("FREE_LIMIT_REACHED")) {
        setResult(null);
        setShowProModal(true);
        setFeedback("Has alcanzado el limite gratis de 3 analisis hoy.");
        return;
      }
      if (message.includes("TIMEOUT")) {
        setFeedback("Mostramos tu resultado localmente. La sincronizacion puede tardar unos segundos.");
        return;
      }
      // Keep UX clean even if cloud sync has temporary permission/config issues.
      setFeedback("");
    }
  };

  const onDownload = () => {
    if (!result) return;
    const image = createPersonalityImage(result, APP_NAME);
    if (!image) return;
    const anchor = document.createElement("a");
    anchor.href = image;
    anchor.download = `truthscan-perfil-${result.id}.png`;
    anchor.click();
    setSaved(true);
    setTimeout(() => setSaved(false), 1300);
  };

  const onShare = async () => {
    if (!result) return;
    const text = buildPersonalityShareText(result);
    try {
      if (navigator.share) {
        await navigator.share({ title: `${APP_NAME} - Mi perfil`, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // User cancelled share flow.
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs hover:border-cyan-300/40">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        {isAuthenticated && plan === "free" ? <span className="pill">Quedan {quota?.remaining ?? 0} analisis hoy</span> : null}
      </div>

      {loading ? (
        <div className="glass rounded-3xl p-7 text-center">
          <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-cyan-300" />
          <p className="text-sm text-white/75">Procesando tu perfil emocional...</p>
        </div>
      ) : result ? (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass rounded-3xl p-6">
            <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-300">Resultado del test</p>
            <h1 className="mt-1 text-3xl font-bold text-white">{result.name}</h1>
            <p className="mt-2 text-sm text-white/75">{result.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass rounded-2xl p-4">
              <p className="text-sm font-semibold text-white/90">Fortalezas</p>
              <ul className="mt-2 space-y-2 text-sm text-white/80">
                {result.strengths.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-sm font-semibold text-white/90">Riesgos en relaciones</p>
              <ul className="mt-2 space-y-2 text-sm text-white/80">
                {result.risks.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={onShare} className="cta-primary glow-hover inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white">
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Texto copiado" : "Compartir resultado"}
              </button>
              <button onClick={onDownload} className="glow-hover inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                {saved ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                Descargar
              </button>
              <button
                onClick={() => {
                  setStep(0);
                  setAnswers({});
                  setResult(null);
                }}
                className="glow-hover inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Repetir test
              </button>
            </div>
          </div>
        </motion.section>
      ) : (
        <section className="glass rounded-3xl p-6">
          <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-300">Test psicologico viral</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Descubre que tipo de persona eres en relaciones</h1>
          <p className="mt-2 text-sm text-white/70">Responde en 60 segundos y obten un perfil compartible.</p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-white/60">
              <span>Paso {step + 1} de {questions.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00D1FF]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="mt-6">
              <h2 className="text-lg font-semibold text-white">{current.prompt}</h2>
              <div className="mt-3 grid gap-3">
                {current.options.map((option) => {
                  const selected = answers[current.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onSelect(option.id)}
                      className={`native-tap rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        selected ? "border-cyan-300/70 bg-cyan-300/10 text-white" : "border-white/15 bg-white/5 text-white/85 hover:border-cyan-300/35"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setStep((prev) => Math.max(0, prev - 1))} disabled={step === 0} className="native-tap rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 disabled:opacity-40">
              Atras
            </button>
            {isLast ? (
              <button type="button" onClick={onAnalyze} disabled={!done} className="cta-primary glow-hover native-tap rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Ver perfil
              </button>
            ) : (
              <button type="button" onClick={() => setStep((prev) => Math.min(questions.length - 1, prev + 1))} disabled={!hasAnswer} className="cta-primary glow-hover native-tap rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Siguiente
              </button>
            )}
          </div>
        </section>
      )}

      {feedback ? (
        <p className="mt-3 text-center text-xs text-cyan-300">{feedback}</p>
      ) : null}

      <ProLimitModal open={showProModal} onClose={() => setShowProModal(false)} />
      {!isAuthenticated ? (
        <div className="mt-4 text-center text-xs text-white/60">
          <button onClick={() => navigate("/login", { state: { from: "/personality-test" } })} className="text-cyan-300 hover:underline">
            Inicia sesion para guardar tus resultados
          </button>
        </div>
      ) : null}
    </main>
  );
}

export default PersonalityTest;
