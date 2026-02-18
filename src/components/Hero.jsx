import { motion } from "framer-motion";
import { ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_NAME } from "../lib/appConfig";

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/12 bg-black/35 px-5 py-10 shadow-[0_0_45px_rgba(108,92,231,0.28)] sm:px-6 md:px-10 md:py-16">
      <div className="pointer-events-none absolute -left-20 top-0 h-60 w-60 rounded-full bg-[#6C5CE7]/35 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-20 h-52 w-52 rounded-full bg-[#00D1FF]/30 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative z-10">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-cyan-200">
          <Sparkles className="h-4 w-4" />
          Startup emocional impulsada por IA
        </span>

        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
          Descubre si te estan mintiendo <span className="text-[#00D1FF]">en 30 segundos</span>
        </h1>

        <p className="mt-4 max-w-2xl text-base text-white/75 sm:text-lg">
          Analiza conversaciones, relaciones y señales ocultas con IA. Menos dudas, mas claridad emocional.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <Link to="/analyze" className="cta-primary glow-hover native-tap inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white sm:w-auto">
            Analizar ahora
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/relationship-check"
            className="glow-hover native-tap inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/45 bg-cyan-300/10 px-5 py-3 font-semibold text-white sm:w-auto"
          >
            ¿Tu relacion esta sana? Descubrelo
          </Link>
          <Link
            to="/personality-test"
            className="glow-hover native-tap inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white sm:w-auto"
          >
            Test de personalidad relacional
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass mt-9 max-w-md rounded-2xl p-4"
        >
          <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300">Ejemplo de resultado</p>
          <p className="mt-2 text-sm text-white/90">Compatibilidad emocional: <span className="font-bold text-cyan-300">42%</span></p>
          <p className="mt-1 text-sm text-white/90">Riesgo de manipulacion: <span className="font-bold text-[#FF4D6D]">Alto</span></p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-white/65">
            <ShieldAlert className="h-4 w-4 text-[#FF4D6D]" />
            {APP_NAME} es orientativo, no reemplaza apoyo profesional.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;
