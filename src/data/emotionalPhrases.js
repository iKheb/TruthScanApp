export const EMOTIONAL_PHRASES = [
  "Tu caso es mas complejo que el promedio.",
  "Este patron suele terminar en distanciamiento emocional.",
  "Hay senales mixtas dificiles de ignorar.",
  "Si sigues asi, podrias agotarte emocionalmente.",
  "La inconsistencia repetida rara vez mejora sin conversaciones claras.",
  "Hay mas intuicion valida en ti de la que estas escuchando.",
  "Lo que hoy confunde, manana puede doler mas.",
];

function simpleHash(input) {
  const raw = String(input || "truthscan");
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickEmotionalPhrase(seed) {
  const index = simpleHash(seed) % EMOTIONAL_PHRASES.length;
  return EMOTIONAL_PHRASES[index];
}
