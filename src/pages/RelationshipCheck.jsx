import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, CheckCircle2, HeartPulse, Loader2, Share2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SavePersonModal from "../components/SavePersonModal";
import ScoreRing from "../components/ScoreRing";
import ProLimitModal from "../components/ProLimitModal";
import { useAuth } from "../context/AuthContext";
import { trackAnalyticsEvent } from "../services/analytics";
import { consumeDailyAnalysisQuota, savePersonAnalysis } from "../services/firebase";
import { buildRelationshipShareText, runRelationshipCheck } from "../services/relationshipCheckEngine";
import { RELATIONSHIP_CHECK_TEST } from "../data/relationshipCheckQuestions";

function RelationshipCheck() {
  const navigate = useNavigate();
  const { isAuthenticated, plan, quota, refreshPlanAndQuota } = useAuth();

  const questions = RELATIONSHIP_CHECK_TEST.questions;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savingPerson, setSavingPerson] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [savedPersonId, setSavedPersonId] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [showProModal, setShowProModal] = useState(false);

  const progress = Math.round((Math.min(step + 1, questions.length) / questions.length) * 100);
  const current = questions[step];
  const hasAnswer = Boolean(current && answers[current.id]);
  const isLastStep = step === questions.length - 1;
  const canSubmit = Object.keys(answers).length === questions.length;

  const shareText = useMemo(() => {
    if (!result) return "";
    return buildRelationshipShareText(result);
  }, [result]);

  const onSelectOption = (optionId) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: optionId }));
  };

  const onNext = () => {
    if (!current || !hasAnswer) return;
    if (isLastStep) return;
    setStep((prev) => prev + 1);
  };

  const onBack = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setSaveSuccess("");
    trackAnalyticsEvent("relationship_check_started", { answers_count: Object.keys(answers).length });

    try {
      if (isAuthenticated && plan === "free") {
        await consumeDailyAnalysisQuota();
      }
      const output = await runRelationshipCheck(answers, questions);
      await refreshPlanAndQuota();
      setResult(output.result);
      setSourceText(output.sourceText);
      trackAnalyticsEvent("relationship_check_result_generated", {
        reciprocity_level: output.result.reciprocityLevel,
        badge: output.result.badge,
      });
    } catch (submitError) {
      const message = submitError.message || "No se pudo generar el diagnostico en este momento.";
      if (String(message).includes("FREE_LIMIT_REACHED")) {
        setShowProModal(true);
        setError("Has alcanzado el limite gratis de 3 analisis hoy.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onShare = async () => {
    if (!result) return;
    try {
      const payload = { text: shareText };
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
      trackAnalyticsEvent("relationship_check_shared", { channel: navigator.share ? "native_share" : "copy" });
    } catch {
      // User cancelled native share.
    }
  };

  const onSavePerson = async (personName) => {
    if (!result) return;
    if (!isAuthenticated) {
      setSaveError("Inicia sesion con Google para guardar este analisis.");
      return;
    }

    setSaveError("");
    setSavingPerson(true);
    try {
      const output = await savePersonAnalysis({
        personName,
        chatText: sourceText || "[test relationship-check]",
        analysis: {
          interestScore: result.reciprocityLevel,
          honestyScore: result.interestScore,
          emotionalTone: result.badge,
          manipulationFlags: result.redFlags,
          verdict: `${result.diagnosis}\n\nRecomendacion: ${result.recommendation}`,
          analysisMode: "modo_terapeuta",
        },
      });

      setSaveModalOpen(false);
      setSavedPersonId(output.personId);
      setSaveSuccess("Analisis guardado para comparar evolucion.");
    } catch (savePersonError) {
      setSaveError(savePersonError.message || "No se pudo guardar este analisis.");
    } finally {
      setSavingPerson(false);
    }
  };

  const onRestart = () => {
    setStep(0);
    setAnswers({});
    setLoading(false);
    setResult(null);
    setError("");
    setCopied(false);
    setSaveError("");
    setSaveSuccess("");
    setSavedPersonId("");
    setSourceText("");
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs hover:border-cyan-300/40">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <span className="pill">
          <HeartPulse className="h-3.5 w-3.5 text-cyan-300" />
          Relationship Check
        </span>
      </div>

      {loading ? (
        <div className="glass rounded-3xl p-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-300/15">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
          </div>
          <p className="text-lg font-semibold text-white">La IA esta leyendo tu dinamica emocional...</p>
          <p className="mt-1 text-sm text-white/65">Buscando patrones de reciprocidad, coherencia y red flags.</p>
        </div>
      ) : result ? (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="glass rounded-3xl p-6">
            <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300">Diagnostico de tu relacion</p>
            <h1 className="display-font mt-1 text-3xl font-extrabold sm:text-4xl">Asi se ve tu dinamica hoy</h1>
            <p className="mt-2 text-sm text-white/70">No es una sentencia final: es una foto emocional del momento.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreRing score={result.reciprocityLevel} label="Reciprocidad estimada" colorClass="text-cyan-300" />
            <ScoreRing
              score={result.interestScore}
              label="Interes estimado"
              colorClass={result.reciprocityLevel < 45 ? "text-[#FF4D6D]" : "text-cyan-300"}
            />
          </div>

          <div className="glass rounded-2xl p-4">
            <p className="pill">{result.badge}</p>
            <p className="mt-3 rounded-2xl border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 p-4 text-sm text-white">{result.highlight}</p>
          </div>

          <div className="glass rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white/90">Diagnostico emocional</h2>
            <p className="mt-2 text-sm text-white/80">{result.diagnosis}</p>
            {result.redFlags?.length ? (
              <>
                <p className="mt-4 text-xs uppercase tracking-[0.12em] text-[#FF4D6D]">Posibles red flags</p>
                <ul className="mt-2 space-y-2 text-sm text-white/85">
                  {result.redFlags.map((flag) => (
                    <li key={flag} className="rounded-xl border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 px-3 py-2">
                      {flag}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="mt-4 text-sm font-medium text-cyan-300">Recomendacion: {result.recommendation}</p>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={onShare} className="cta-primary glow-hover inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white">
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Texto copiado" : "Compartir resultado"}
              </button>
              <button
                onClick={onRestart}
                className="glow-hover inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Comparar con otra persona
              </button>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setSaveError("");
                    setSaveModalOpen(true);
                  }}
                  className="glow-hover inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Guardar este analisis
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login", { state: { from: "/relationship-check" } })}
                  className="glow-hover inline-flex items-center gap-2 rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Inicia sesion para guardar
                </button>
              )}
            </div>
            {saveSuccess ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <p className="inline-flex items-center gap-1.5 text-cyan-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {saveSuccess}
                </p>
                {savedPersonId ? (
                  <Link to={`/saved/${savedPersonId}`} className="font-semibold text-cyan-300 hover:underline">
                    Ver historial
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </motion.section>
      ) : (
        <section className="glass rounded-3xl p-5 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300">Test guiado</p>
          <h1 className="display-font mt-1 text-3xl font-extrabold sm:text-4xl">¿Tu relacion esta sana? Descubrelo</h1>
          <p className="mt-2 text-sm text-white/70">Responde rapido y te damos un diagnostico emocional claro y compartible.</p>
          {isAuthenticated && plan === "free" ? (
            <p className="mt-1 text-xs text-cyan-300">{quota?.limit == null ? "Analisis ilimitados por ahora." : `Te quedan ${quota?.remaining ?? 0} analisis hoy.`}</p>
          ) : null}

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
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="mt-6"
            >
              <h2 className="text-xl font-semibold text-white">{current.prompt}</h2>
              <div className="mt-4 grid gap-3">
                {current.options.map((option) => {
                  const selected = answers[current.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onSelectOption(option.id)}
                      className={`native-tap rounded-2xl border px-4 py-3 text-left text-base transition ${
                        selected
                          ? "border-cyan-300/70 bg-cyan-300/10 text-white"
                          : "border-white/15 bg-white/5 text-white/85 hover:border-cyan-300/35"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {error ? (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-[#FF4D6D]">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              disabled={step === 0}
              className="native-tap rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 disabled:opacity-40"
            >
              Atras
            </button>
            {isLastStep ? (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className="cta-primary glow-hover native-tap rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Ver diagnostico
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                disabled={!hasAnswer}
                className="cta-primary glow-hover native-tap rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Siguiente
              </button>
            )}
          </div>
        </section>
      )}

      <SavePersonModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={onSavePerson}
        loading={savingPerson}
        error={saveError}
      />
      <ProLimitModal open={showProModal} onClose={() => setShowProModal(false)} />
    </main>
  );
}

export default RelationshipCheck;
