import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Bookmark, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SkeletonBlock from "../components/SkeletonBlock";
import { getSavedPeople } from "../services/firebase";

function formatDate(value) {
  const date =
    value?.toDate?.() ||
    (typeof value === "string" ? new Date(value) : null) ||
    (value instanceof Date ? value : null);
  if (!date || Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function SavedPeople() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const list = await getSavedPeople(60);
        if (!active) return;
        setPeople(list);
      } catch (loadError) {
        if (active) setError(loadError.message || "No se pudieron cargar tus personas guardadas.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const totalAnalyses = useMemo(
    () => people.reduce((sum, person) => sum + Number(person.analysesCount || 0), 0),
    [people],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <div className="pill mb-3">
          <Bookmark className="h-3.5 w-3.5 text-cyan-300" />
          Retencion emocional
        </div>
        <h1 className="display-font text-3xl font-extrabold sm:text-4xl">Personas guardadas</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">Mira como evoluciona esta historia con cada nuevo chat.</p>
        <p className="mt-3 text-xs text-cyan-300">Algunas verdades cambian con el tiempo.</p>
      </section>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-white/60">Personas</p>
          <p className="mt-1 text-2xl font-bold text-white">{people.length}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-white/60">Analisis guardados</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalAnalyses}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-white/60">Objetivo</p>
          <p className="mt-1 text-sm font-medium text-white/90">Comparar patrones y detectar cambios reales.</p>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-6">
          <SkeletonBlock className="mb-3 h-4 w-40" />
          <SkeletonBlock className="mb-2 h-3 w-64" />
          <SkeletonBlock className="h-3 w-56" />
        </div>
      ) : error ? (
        <div className="glass flex items-center gap-3 rounded-2xl border border-[#FF4D6D]/30 p-6 text-sm text-[#FF4D6D]">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : people.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 text-center">
          <p className="text-base font-semibold text-white">Aun no has guardado a nadie...</p>
          <p className="mt-2 text-sm text-white/65">Guarda tu primer resultado para ver la historia completa.</p>
          <Link to="/analyze" className="cta-primary glow-hover mt-4 inline-flex rounded-2xl px-4 py-2 text-sm font-semibold text-white">
            Analizar un chat
          </Link>
        </motion.div>
      ) : (
        <ul className="space-y-3">
          {people.map((person, index) => (
            <motion.li
              key={person.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{person.name}</p>
                  <p className="mt-1 text-xs text-white/65">Analisis: {person.analysesCount || 0}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/55">
                    <Clock3 className="h-3.5 w-3.5" />
                    Ultimo movimiento: {formatDate(person.lastAnalysisAt)}
                  </p>
                </div>
                <Link
                  to={`/saved/${person.id}`}
                  className="glow-hover inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Ver evolucion
                  <ArrowRight className="h-4 w-4 text-cyan-300" />
                </Link>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default SavedPeople;
