import { AlertTriangle } from "lucide-react";

function FlagList({ flags = [] }) {
  if (!flags.length) {
    return (
      <div className="glass rounded-2xl p-6">
        <p className="text-sm text-white/70">Sin alertas criticas. La conversacion no muestra patron manipulativo fuerte.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#FF4D6D]">
        <AlertTriangle className="h-4 w-4" />
        Alertas detectadas
      </h3>
      <ul className="space-y-2 text-sm">
        {flags.map((flag) => (
          <li key={flag} className="rounded-xl border border-[#FF4D6D]/40 bg-[#FF4D6D]/15 px-3 py-2 text-[#FF4D6D]">
            {flag}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FlagList;