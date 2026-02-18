import { MessageSquareHeart } from "lucide-react";

function EmotionalInsightCard({ phrase }) {
  return (
    <div className="glass rounded-2xl border border-cyan-300/25 p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-300">Insight emocional</p>
      <p className="mt-2 inline-flex items-start gap-2 text-sm text-white/90">
        <MessageSquareHeart className="mt-0.5 h-4 w-4 text-cyan-300" />
        <span>{phrase}</span>
      </p>
    </div>
  );
}

export default EmotionalInsightCard;
