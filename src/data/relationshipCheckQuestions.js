export const RELATIONSHIP_CHECK_TEST = {
  id: "relationship_check_v1",
  name: "Analizar mi relacion actual",
  description: "Test guiado para medir reciprocidad, consistencia emocional y red flags.",
  questions: [
    {
      id: "who_starts_chat",
      prompt: "¿Quien escribe primero la mayoria de las veces?",
      options: [
        { id: "yo", label: "Yo" },
        { id: "otra_persona", label: "La otra persona" },
        { id: "equilibrado", label: "50/50" },
      ],
    },
    {
      id: "response_time",
      prompt: "¿Cuanto tarda en responder normalmente?",
      options: [
        { id: "minutos", label: "Minutos" },
        { id: "horas", label: "Horas" },
        { id: "dias", label: "A veces dias" },
      ],
    },
    {
      id: "plan_cancellations",
      prompt: "¿Con que frecuencia cancelan planes?",
      options: [
        { id: "nunca", label: "Nunca" },
        { id: "a_veces", label: "A veces" },
        { id: "frecuente", label: "Frecuente" },
      ],
    },
    {
      id: "interest_balance",
      prompt: "¿Sientes que muestras mas interes?",
      options: [
        { id: "si", label: "Si" },
        { id: "no", label: "No" },
        { id: "duda", label: "No estoy seguro/a" },
      ],
    },
    {
      id: "post_chat_feeling",
      prompt: "¿Como te sientes despues de hablar con esa persona?",
      options: [
        { id: "bien", label: "Bien" },
        { id: "neutral", label: "Neutral" },
        { id: "ansioso", label: "Ansioso/a" },
      ],
    },
  ],
};

export function summarizeRelationshipAnswers(answers, questions = RELATIONSHIP_CHECK_TEST.questions) {
  return questions
    .map((question) => {
      const answerId = answers?.[question.id];
      const option = question.options.find((item) => item.id === answerId);
      if (!option) return null;
      return `- ${question.prompt} ${option.label}.`;
    })
    .filter(Boolean)
    .join("\n");
}
