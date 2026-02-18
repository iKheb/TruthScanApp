import { Loader2, LogIn } from "lucide-react";

function GoogleAuthButton({ onClick, loading, children = "Continuar con Google", className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`glow-hover inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4 text-cyan-300" />}
      {loading ? "Conectando..." : children}
    </button>
  );
}

export default GoogleAuthButton;
