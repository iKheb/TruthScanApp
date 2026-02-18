export const DEFAULT_ANALYSIS_MODE_ID = "brutal_honesto";

export const ANALYSIS_MODES = [
  {
    id: "brutal_honesto",
    name: "Brutalmente honesto",
    description: "Directo, claro y sin suavizar la verdad.",
    promptTone:
      "Habla como un amigo brutalmente honesto pero empatico. Di verdades incomodas con respeto, sin rodeos ni tecnicismos frios.",
  },
  {
    id: "modo_terapeuta",
    name: "Modo terapeuta",
    description: "Empatico, reflexivo y emocionalmente inteligente.",
    promptTone:
      "Habla con calidez y empatia terapeutica. Ayuda a comprender emociones y patrones sin juzgar ni diagnosticar.",
  },
  {
    id: "sin_filtros",
    name: "Sin filtros",
    description: "Crudo, provocador y viral, pero sin ser ofensivo.",
    promptTone:
      "Habla con tono crudo, provocador y viral, pero nunca ofensivo. Prioriza impacto emocional y claridad inmediata.",
  },
  {
    id: "frio_analitico",
    name: "Frio analitico",
    description: "Objetivo, logico y basado en patrones.",
    promptTone:
      "Habla con estilo objetivo y logico. Enfocate en patrones observables y conclusiones concretas, sin drama innecesario.",
  },
];

export function getAnalysisModeConfig(modeId) {
  return ANALYSIS_MODES.find((mode) => mode.id === modeId) || ANALYSIS_MODES[0];
}
