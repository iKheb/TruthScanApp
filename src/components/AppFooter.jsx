import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import GoogleAuthButton from "./GoogleAuthButton";

function AppFooter() {
  const { user, logout, login, isAuthenticated, plan, quota } = useAuth();
  const [loading, setLoading] = useState(false);

  const onAuthAction = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await logout();
      } else {
        await login();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-6 pt-2 sm:px-6">
      <div className="glass flex flex-col gap-3 rounded-2xl px-4 py-3 text-xs text-white/70 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-cyan-300" />
          Este analisis es orientativo y no reemplaza asesoramiento profesional.
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isAuthenticated ? <span className="pill hidden sm:inline-flex">{plan === "pro" ? "Plan Pro" : `Free: ${quota?.remaining ?? 0} hoy`}</span> : null}
          {isAuthenticated ? <span className="hidden text-white/55 sm:inline">{user?.email || "Sesion activa"}</span> : null}
          <GoogleAuthButton
            onClick={onAuthAction}
            loading={loading}
            className="rounded-xl px-3 py-1.5 text-xs"
          >
            {isAuthenticated ? "Cerrar sesion" : "Continuar con Google"}
          </GoogleAuthButton>
          <Link to="/saved" className="font-medium text-cyan-300 hover:underline">
            Personas guardadas
          </Link>
          <Link to="/privacy" className="font-medium text-cyan-300 hover:underline">
            Politica de privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
