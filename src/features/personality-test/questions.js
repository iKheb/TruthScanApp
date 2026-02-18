export const PERSONALITY_TEST = {
  id: "relationship_personality_v1",
  title: "Descubre que tipo de persona eres en relaciones",
  questions: [
    {
      id: "trust_speed",
      prompt: "Cuando conoces a alguien que te gusta, sueles...",
      options: [
        { id: "slow", label: "Ir paso a paso", scores: { analyst: 2, romantic: 1 } },
        { id: "fast", label: "Confiar rapido", scores: { intense: 2, romantic: 1 } },
        { id: "observe", label: "Observar antes de abrirte", scores: { detector: 2, analyst: 1 } },
      ],
    },
    {
      id: "conflict_style",
      prompt: "Si notas distancia, tu reaccion principal es...",
      options: [
        { id: "direct", label: "Hablarlo directo", scores: { analyst: 2, detector: 1 } },
        { id: "anxious", label: "Pensarlo demasiado", scores: { intense: 2 } },
        { id: "intuitive", label: "Seguir tu intuicion", scores: { romantic: 2, detector: 1 } },
      ],
    },
    {
      id: "message_gap",
      prompt: "Si tarda en responder, piensas que...",
      options: [
        { id: "context", label: "Puede estar ocupado/a", scores: { analyst: 2 } },
        { id: "fear", label: "Algo va mal", scores: { intense: 2 } },
        { id: "pattern", label: "Hay un patron detras", scores: { detector: 2 } },
      ],
    },
    {
      id: "love_language",
      prompt: "Lo que mas valoras en una conexion es...",
      options: [
        { id: "clarity", label: "Claridad y coherencia", scores: { analyst: 2, detector: 1 } },
        { id: "intensity", label: "Intensidad emocional", scores: { intense: 2, romantic: 1 } },
        { id: "chemistry", label: "Quimica e intuicion", scores: { romantic: 2 } },
      ],
    },
    {
      id: "red_flag_response",
      prompt: "Cuando detectas una red flag, normalmente...",
      options: [
        { id: "boundary", label: "Pones limites", scores: { analyst: 2 } },
        { id: "second_chance", label: "Das otra oportunidad", scores: { romantic: 2 } },
        { id: "investigate", label: "Investigas mas senales", scores: { detector: 2 } },
      ],
    },
    {
      id: "attachment_hint",
      prompt: "En relaciones, tu mayor reto suele ser...",
      options: [
        { id: "overthink", label: "Sobrepensar", scores: { intense: 2 } },
        { id: "control", label: "Intentar entender todo", scores: { analyst: 2 } },
        { id: "idealize", label: "Idealizar", scores: { romantic: 2 } },
      ],
    },
    {
      id: "intuition_use",
      prompt: "Tu intuicion en relaciones te sirve para...",
      options: [
        { id: "detect", label: "Detectar mentiras", scores: { detector: 2 } },
        { id: "connect", label: "Conectar emocionalmente", scores: { romantic: 2 } },
        { id: "balance", label: "Tomar decisiones con calma", scores: { analyst: 1, intense: 1 } },
      ],
    },
  ],
};

export const PERSONALITY_PROFILES = {
  analyst: {
    id: "analyst",
    name: "El analista emocional",
    description: "Lees patrones con frialdad y buscas coherencia entre palabras y acciones.",
    strengths: ["Detectas inconsistencias rapido", "Pones limites claros", "No te dejas llevar facil"],
    risks: ["Puedes analizar demasiado", "A veces te cuesta soltar el control"],
  },
  intense: {
    id: "intense",
    name: "El confiado intenso",
    description: "Te entregas con fuerza y sientes todo en alta definicion emocional.",
    strengths: ["Te involucras de verdad", "No juegas a medias", "Conectas rapido con emociones"],
    risks: ["Puedes sobreinvertir energia", "La ansiedad puede nublar decisiones"],
  },
  detector: {
    id: "detector",
    name: "El detector natural de mentiras",
    description: "Percibes micro senales que otros pasan por alto y captas cambios de narrativa.",
    strengths: ["Gran intuicion para red flags", "Buena lectura de contexto", "Sueles anticipar problemas"],
    risks: ["Puedes desconfiar demasiado", "A veces esperas lo peor"],
  },
  romantic: {
    id: "romantic",
    name: "El romantico intuitivo",
    description: "Tu radar emocional conecta desde la empatia y la quimica afectiva.",
    strengths: ["Calidez emocional", "Alto nivel de empatia", "Construyes vinculos profundos"],
    risks: ["Puedes idealizar personas", "Te cuesta cortar cuando algo duele"],
  },
};
