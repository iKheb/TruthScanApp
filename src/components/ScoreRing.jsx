import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

function ScoreRing({ score, label, colorClass = "text-cyan-300" }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = useMotionValue(0);
  const display = useTransform(progress, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(progress, score, { duration: 1.2, ease: "easeOut" });
    return () => controls.stop();
  }, [progress, score]);

  return (
    <div className="glass flex flex-col items-center gap-3 rounded-2xl p-5">
      <div className="relative h-32 w-32">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            stroke="url(#ringGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: useTransform(progress, (value) => circumference - (value / 100) * circumference),
            }}
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C5CE7" />
              <stop offset="100%" stopColor="#00D1FF" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span className={`text-2xl font-bold ${colorClass}`}>{display}</motion.span>
        </div>
      </div>
      <p className="text-sm text-white/75">{label}</p>
    </div>
  );
}

export default ScoreRing;