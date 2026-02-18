import { Link } from "react-router-dom";

function Privacy() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <article className="glass rounded-3xl p-6 sm:p-8">
        <h1 className="display-font text-3xl font-extrabold">Politica de privacidad</h1>
        <p className="mt-3 text-sm text-white/75">
          TruthScan esta disenado para minimizar datos sensibles. Por defecto, el texto completo del chat no se almacena.
        </p>

        <div className="mt-6 space-y-4 text-sm text-white/75">
          <p>
            1. Recoleccion: Guardamos resultados del analisis (scores, flags y veredicto). El texto completo solo se guarda si lo activas manualmente.
          </p>
          <p>
            2. Uso: Los datos se usan para mostrar historial, resultados compartibles y mejorar experiencia del producto.
          </p>
          <p>
            3. Seguridad: Usamos autenticacion con Google y reglas de Firestore para proteger acceso por usuario.
          </p>
          <p>
            4. Control: Puedes evitar guardar contenido sensible dejando desactivada la opcion de almacenamiento completo.
          </p>
        </div>

        <Link to="/analyze" className="mt-6 inline-block text-sm font-medium text-cyan-300 hover:underline">
          Volver al analizador
        </Link>
      </article>
    </main>
  );
}

export default Privacy;
