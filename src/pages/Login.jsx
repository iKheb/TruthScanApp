import { motion } from "framer-motion";
import { AlertCircle, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/saved";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [from, isAuthenticated, navigate]);

  const onLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await login();
      navigate(from, { replace: true });
    } catch (loginError) {
      setError(loginError.message || "No se pudo iniciar sesion con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full rounded-3xl p-6 sm:p-8"
      >
        <div className="pill mb-4">
          <LockKeyhole className="h-3.5 w-3.5 text-cyan-300" />
          Acceso protegido
        </div>
        <h1 className="display-font text-3xl font-extrabold">Continua con Google</h1>
        <p className="mt-2 text-sm text-white/70">
          Necesitas iniciar sesion para ver personas guardadas y sincronizar tu historial en todos tus dispositivos.
        </p>
        <p className="mt-3 text-xs text-cyan-300">Tus analisis guardados se asocian a tu cuenta de forma segura.</p>

        <div className="mt-6">
          <GoogleAuthButton onClick={onLogin} loading={loading} className="w-full py-3 text-base" />
        </div>

        {error ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-[#FF4D6D]">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        ) : null}

        <div className="mt-6 text-xs text-white/60">
          <Link to="/analyze" className="text-cyan-300 hover:underline">
            Volver al analizador
          </Link>
        </div>
      </motion.section>
    </main>
  );
}

export default Login;
