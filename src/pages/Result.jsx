import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, BookmarkPlus, CheckCircle2, Gauge, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getAnalysisModeConfig } from "../../shared/analysisModes";
import FlagList from "../components/FlagList";
import EmotionalInsightCard from "../components/EmotionalInsightCard";
import ModeSelector from "../components/ModeSelector";
import SavePersonModal from "../components/SavePersonModal";
import SkeletonBlock from "../components/SkeletonBlock";
import ScoreRing from "../components/ScoreRing";
import ShareButton from "../components/ShareButton";
import VerdictCard from "../components/VerdictCard";
import { useAuth } from "../context/AuthContext";
import { useAnalysisMode } from "../context/AnalysisModeContext";
import { pickEmotionalPhrase } from "../data/emotionalPhrases";
import { getCachedChatByAnalysisId, useAnalysis } from "../hooks/useAnalysis";
import { trackAnalyticsEvent } from "../services/analytics";
import { buildOgImageDataUri, buildShareText } from "../services/shareContent";
import { getAnalysisById, isFirebaseConfigured, savePersonAnalysis } from "../services/firebase";

function computeRiskLabel(analysis) {
  const combined = ((analysis?.interestScore || 0) + (analysis?.honestyScore || 0)) / 2;
  const hasFlags = (analysis?.manipulationFlags?.length || 0) > 0;
  if (combined >= 70 && !hasFlags) return "Riesgo bajo";
  if (combined >= 45) return "Riesgo moderado";
  return "Riesgo alto";
}

function updateSocialMeta({ analysisId, analysis, riskLabel }) {
  const shareText = buildShareText(analysis);
  const title = `TruthScan Result ${analysisId}`;
  const description = shareText;
  const shareUrl = `${window.location.origin}/result/${analysisId}`;
  const dynamicImage = buildOgImageDataUri({ id: analysisId, analysis, riskLabel });

  document.title = `${title} | TruthScan`;

  const ensureMeta = (selector, key, keyValue, content) => {
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(key, keyValue);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  };

  ensureMeta('meta[property="og:title"]', "property", "og:title", title);
  ensureMeta('meta[property="og:description"]', "property", "og:description", description);
  ensureMeta('meta[property="og:url"]', "property", "og:url", shareUrl);
  ensureMeta('meta[property="og:image"]', "property", "og:image", dynamicImage);
  ensureMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
  ensureMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
  ensureMeta('meta[name="twitter:image"]', "name", "twitter:image", dynamicImage);
}

function Result() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { runAnalysis, loading: reanalyzing } = useAnalysis();
  const { modeId, setModeId, modes } = useAnalysisMode();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(!location.state?.analysis);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(location.state?.analysis || null);
  const [showReanalyze, setShowReanalyze] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savingPerson, setSavingPerson] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [savedPersonId, setSavedPersonId] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (location.state?.analysis) {
        const stateAnalysis = location.state.analysis;
        const stateRisk = computeRiskLabel(stateAnalysis);
        updateSocialMeta({ analysisId: id, analysis: stateAnalysis, riskLabel: stateRisk });
        return;
      }

      if (!isFirebaseConfigured) {
        setError("No se pudo cargar el resultado: Firebase no esta configurado en este entorno.");
        setLoading(false);
        return;
      }

      try {
        const doc = await getAnalysisById(id);
        if (!active) return;

        if (!doc) {
          setError("Resultado no encontrado.");
          setLoading(false);
          return;
        }

        const mapped = {
          id: doc.id,
          text: doc.text,
          interestScore: doc.scores?.interestScore ?? 0,
          honestyScore: doc.scores?.honestyScore ?? 0,
          manipulationFlags: doc.flags ?? [],
          verdict: doc.verdict || "Sin veredicto disponible.",
          emotionalTone: doc.emotionalTone || "No definido",
          analysisMode: doc.analysisMode || "brutal_honesto",
        };

        setAnalysis(mapped);
        const mappedRisk = computeRiskLabel(mapped);
        updateSocialMeta({ analysisId: id, analysis: mapped, riskLabel: mappedRisk });
      } catch (fetchError) {
        if (active) setError(fetchError.message || "No se pudo recuperar el resultado.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id, location.state]);

  const hasFlags = useMemo(() => analysis?.manipulationFlags?.length > 0, [analysis]);
  const riskLabel = useMemo(() => {
    if (!analysis) return "";
    return computeRiskLabel(analysis);
  }, [analysis, hasFlags]);
  const dynamicPhrase = useMemo(() => {
    if (!analysis) return "";
    const seed = `${id}-${analysis.interestScore}-${analysis.honestyScore}-${analysis.verdict}`;
    return pickEmotionalPhrase(seed);
  }, [analysis, id]);

  const usedMode = useMemo(() => getAnalysisModeConfig(analysis?.analysisMode), [analysis?.analysisMode]);

  useEffect(() => {
    if (analysis?.analysisMode) {
      setModeId(analysis.analysisMode);
    }
  }, [analysis?.analysisMode, setModeId]);

  const onReanalyze = async () => {
    const availableText =
      location.state?.text ||
      getCachedChatByAnalysisId(id) ||
      (analysis?.text && analysis.text !== "[oculto por privacidad]" ? analysis.text : "");

    if (!availableText) {
      setError("No hay chat disponible para reanalizar en otro modo en esta sesion.");
      return;
    }

    try {
      const output = await runAnalysis(availableText, { modeId, storeFullText: false });
      navigate(`/result/${output.id}`, { state: { analysis: output, text: availableText } });
    } catch (reanalyzeError) {
      setError(reanalyzeError.message || "No se pudo reanalizar en otro modo.");
    }
  };

  const onSavePerson = async (personName) => {
    if (!analysis) return;
    if (!isAuthenticated) {
      setSaveError("Inicia sesion con Google para guardar personas y ver evolucion.");
      return;
    }

    setSaveError("");
    setSavingPerson(true);
    try {
      const availableText =
        location.state?.text ||
        getCachedChatByAnalysisId(id) ||
        (analysis?.text && analysis.text !== "[oculto por privacidad]" ? analysis.text : "");

      const output = await savePersonAnalysis({
        personName,
        chatText: availableText,
        analysis,
      });

      trackAnalyticsEvent("person_saved", {
        analysis_id: id,
        person_id: output.personId,
      });

      setSaveModalOpen(false);
      setSavedPersonId(output.personId);
      setSaveSuccess("Persona guardada. Ya puedes seguir su evolucion.");
      setTimeout(() => setSaveSuccess(""), 2300);
    } catch (savePersonError) {
      setSaveError(savePersonError.message || "No se pudo guardar esta persona.");
    } finally {
      setSavingPerson(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-5 flex flex-col items-stretch justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
        <Link to="/analyze" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs hover:border-cyan-300/40">
          <ArrowLeft className="h-4 w-4" />
          Nuevo analisis
        </Link>
        {analysis && <ShareButton id={id} analysis={analysis} riskLabel={riskLabel} />}
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-8">
          <SkeletonBlock className="mb-4 h-5 w-48" />
          <SkeletonBlock className="mb-2 h-3 w-full" />
          <SkeletonBlock className="h-3 w-5/6" />
        </div>
      ) : error ? (
        <div className="glass flex items-center gap-3 rounded-2xl border border-[#FF4D6D]/30 p-8 text-[#FF4D6D]">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      ) : (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">Lo que la IA vio en tu chat</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                <Gauge className="h-4 w-4 text-cyan-300" />
                {riskLabel}
              </p>
              <p className="mt-2 text-xs text-white/65">Analisis generado en modo: {usedMode.name}</p>
            </div>
            <div className="pill">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              ID: {id}
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white/90">Guardar esta persona</p>
                <p className="text-xs text-white/65">Mira como evoluciona esta historia sin volver a empezar.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSaveError("");
                  if (!isAuthenticated) {
                    navigate("/login", { state: { from: `/result/${id}` } });
                    return;
                  }
                  setSaveModalOpen(true);
                }}
                className="cta-primary glow-hover inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white"
              >
                <BookmarkPlus className="h-4 w-4" />
                Guardar esta persona
              </button>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreRing score={analysis.interestScore} label="Interes reciproco" colorClass="text-cyan-300" />
            <ScoreRing score={analysis.honestyScore} label="Honestidad percibida" colorClass={hasFlags ? "text-[#FF4D6D]" : "text-cyan-300"} />
          </div>

          <VerdictCard verdict={analysis.verdict} tone={analysis.emotionalTone} />
          {dynamicPhrase ? <EmotionalInsightCard phrase={dynamicPhrase} /> : null}
          <FlagList flags={analysis.manipulationFlags} />

          <div className="glass rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white/90">Ver en otro modo</p>
              <button
                type="button"
                onClick={() => setShowReanalyze((prev) => !prev)}
                className="text-xs font-medium text-cyan-300 hover:underline"
              >
                {showReanalyze ? "Ocultar" : "Cambiar estilo"}
              </button>
            </div>

            {showReanalyze ? (
              <div className="mt-4 space-y-3">
                <ModeSelector modes={modes} selectedId={modeId} onSelect={setModeId} />
                <button
                  type="button"
                  onClick={onReanalyze}
                  disabled={reanalyzing}
                  className="cta-primary glow-hover rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {reanalyzing ? "Reanalizando..." : "Ver en otro modo"}
                </button>
              </div>
            ) : null}
          </div>
        </motion.section>
      )}

      <SavePersonModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={onSavePerson}
        loading={savingPerson}
        error={saveError}
      />
    </main>
  );
}

export default Result;
