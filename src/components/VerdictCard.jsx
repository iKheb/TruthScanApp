import { ShieldCheck, ShieldX } from "lucide-react";

function VerdictCard({ verdict, tone }) {
  const riskHigh = verdict.toLowerCase().includes("senales") || verdict.toLowerCase().includes("detect");

  return (
    <article className="glass rounded-2xl p-6">
      <div className="mb-3 flex items-center gap-2">
        {riskHigh ? <ShieldX className="h-5 w-5 text-[#FF4D6D]" /> : <ShieldCheck className="h-5 w-5 text-cyan-300" />}
        <h3 className="text-lg font-semibold">Veredicto IA</h3>
      </div>
      <p className="text-sm leading-relaxed text-white/80">{verdict}</p>
      <div className="mt-4 inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-300">
        Tono emocional: {tone}
      </div>
    </article>
  );
}

export default VerdictCard;