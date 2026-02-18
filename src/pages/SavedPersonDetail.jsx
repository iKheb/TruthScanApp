import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Minus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAnalysisModeConfig } from "../../shared/analysisModes";
import { getSavedPersonDetails } from "../services/firebase";

function formatDate(value) {
  const date =
    value?.toDate?.() ||
    (typeof value === "string" ? new Date(value) : null) ||
    (value instanceof Date ? value : null);
  if (!date || Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getTrend(current, previous) {
  if (current > previous) return { icon: "up", label: "Mejoro", cls: "text-emerald-300" };
  if (current < previous) return { icon: "down", label: "Empeoro", cls: "text-[#FF4D6D]" };
  return { icon: "equal", label: "Igual", cls: "text-white/75" };
}

function generateInsights(latest, previous) {
  if (!latest || !previous) return [];

  const insights = [];
  const interestDelta = Number(latest.interestScore || 0) - Number(previous.interestScore || 0);
  const honestyDelta = Number(latest.honestyScore || 0) - Number(previous.honestyScore || 0);
  const latestFlags = Array.isArray(latest.manipulationFlags) ? latest.manipulationFlags.length : 0;
  const prevFlags = Array.isArray(previous.manipulationFlags) ? previous.manipulationFlags.length : 0;

  if (interestDelta <= -7) insights.push("Su interes ha bajado desde el ultimo analisis.");
  if (interestDelta >= 7) insights.push("Su interes ha subido desde el ultimo analisis.");

  if (honestyDelta >= 7 && latestFlags <= prevFlags) {
    insights.push("Se detecta mayor consistencia emocional.");
  }
  if (honestyDelta <= -7 || latestFlags > prevFlags) {
    insights.push("Hay mas ruido emocional y senales contradictorias.");
  }

  if (Math.abs(interestDelta) < 7 && Math.abs(honestyDelta) < 7 && latestFlags === prevFlags) {
    insights.push("La dinamica se mantiene estable por ahora.");
  }

  return insights.slice(0, 3);
}

function TrendBadge({ title, current, previous }) {
  const trend = getTrend(current, previous);
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <p className="text-xs text-white/60">{title}</p>
      <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
        {trend.icon === "up" ? <ArrowRight className={`h-4 w-4 rotate-[-45deg] ${trend.cls}`} /> : null}
        {trend.icon === "down" ? <ArrowRight className={`h-4 w-4 rotate-45 ${trend.cls}`} /> : null}
        {trend.icon === "equal" ? <Minus className={`h-4 w-4 ${trend.cls}`} /> : null}
        <span className={trend.cls}>{`${trend.label} (${previous} -> ${current})`}</span>
      </div>
    </div>
  );
}

function SavedPersonDetail() {
  const { personId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [person, setPerson] = useState(null);
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getSavedPersonDetails(personId, 50);
        if (!active) return;
        setPerson(data.person);
        setAnalyses(data.analyses);
      } catch (loadError) {
        if (active) setError(loadError.message || "No se pudo cargar esta persona.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [personId]);

  const comparison = useMemo(() => {
    if (analyses.length < 2) return null;
    const latest = analyses[0]?.result || {};
    const previous = analyses[1]?.result || {};
    return {
      interest: {
        current: Number(latest.interestScore || 0),
        previous: Number(previous.interestScore || 0),
      },
      honesty: {
        current: Number(latest.honestyScore || 0),
        previous: Number(previous.honestyScore || 0),
      },
    };
  }, [analyses]);

  const autoInsights = useMemo(() => {
    if (analyses.length < 2) return [];
    const latest = analyses[0]?.result || {};
    const previous = analyses[1]?.result || {};
    return generateInsights(latest, previous);
  }, [analyses]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to="/saved" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs hover:border-cyan-300/40">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-6 text-sm text-white/70">Cargando timeline...</div>
      ) : error ? (
        <div className="glass flex items-center gap-3 rounded-2xl border border-[#FF4D6D]/30 p-6 text-sm text-[#FF4D6D]">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : (
        <>
          <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300">Persona guardada</p>
            <h1 className="display-font mt-1 text-3xl font-extrabold sm:text-4xl">{person?.name}</h1>
            <p className="mt-2 text-sm text-white/70">
              Mira como evoluciona esta historia con el tiempo. Lo que ayer parecia claro, hoy puede cambiar.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-white/90">Comparar ultimos analisis</h2>
            {comparison ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TrendBadge title="Interes reciproco" current={comparison.interest.current} previous={comparison.interest.previous} />
                  <TrendBadge title="Honestidad percibida" current={comparison.honesty.current} previous={comparison.honesty.previous} />
                </div>
                <div className="glass mt-3 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-cyan-300">Insights automaticos</p>
                  <ul className="mt-2 space-y-2 text-sm text-white/85">
                    {autoInsights.map((insight) => (
                      <li key={insight} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="glass rounded-2xl p-4 text-sm text-white/65">Necesitas al menos 2 analisis para ver evolucion.</div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-white/90">Timeline</h2>
            {analyses.length === 0 ? (
              <div className="glass rounded-2xl p-4 text-sm text-white/65">Todavia no hay analisis en esta persona.</div>
            ) : (
              <ul className="space-y-3">
                {analyses.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-2xl p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-white/55">{formatDate(item.createdAt)}</p>
                      <span className="pill">{getAnalysisModeConfig(item.result?.analysisMode).name}</span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/90">
                        Interes: <span className="text-cyan-300">{item.result?.interestScore ?? 0}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/90">
                        Honestidad: <span className="text-cyan-300">{item.result?.honestyScore ?? 0}</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-white/80">{item.result?.verdict || "Sin veredicto disponible."}</p>
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default SavedPersonDetail;
