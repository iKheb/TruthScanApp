const DEFAULT_ANALYSIS_MODE_ID = "brutal_honesto";
const ANALYSIS_MODES = {
  brutal_honesto: {
    id: "brutal_honesto",
    name: "Brutalmente honesto",
    description: "Directo, claro y sin suavizar la verdad.",
    promptTone: "Habla como un amigo brutalmente honesto pero empatico. Di verdades incomodas con respeto, sin rodeos ni tecnicismos frios.",
  },
  modo_terapeuta: {
    id: "modo_terapeuta",
    name: "Modo terapeuta",
    description: "Empatico, reflexivo y emocionalmente inteligente.",
    promptTone: "Habla con calidez y empatia terapeutica. Ayuda a comprender emociones y patrones sin juzgar ni diagnosticar.",
  },
  sin_filtros: {
    id: "sin_filtros",
    name: "Sin filtros",
    description: "Crudo, provocador y viral, pero sin ser ofensivo.",
    promptTone: "Habla con tono crudo, provocador y viral, pero nunca ofensivo. Prioriza impacto emocional y claridad inmediata.",
  },
  frio_analitico: {
    id: "frio_analitico",
    name: "Frio analitico",
    description: "Objetivo, logico y basado en patrones.",
    promptTone: "Habla con estilo objetivo y logico. Enfocate en patrones observables y conclusiones concretas, sin drama innecesario.",
  },
};

const ALLOWED_FLAGS = [
  "Posible ghosting",
  "Posible gaslighting",
  "Baja reciprocidad emocional",
  "Manipulacion emocional potencial",
  "Senales emocionales mixtas",
];

function getModeConfig(modeId) {
  return ANALYSIS_MODES[modeId] || ANALYSIS_MODES[DEFAULT_ANALYSIS_MODE_ID];
}

function buildCorsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...buildCorsHeaders(origin),
      "Cache-Control": "no-store",
    },
  });
}

function clampScore(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeFlags(flags) {
  if (!Array.isArray(flags)) return [];
  return flags
    .map((flag) => String(flag || "").trim())
    .filter((flag) => ALLOWED_FLAGS.includes(flag))
    .slice(0, 5);
}

function normalizeResult(payload, modeId) {
  return {
    interestScore: clampScore(payload?.interestScore),
    honestyScore: clampScore(payload?.honestyScore),
    emotionalTone: String(payload?.emotionalTone || "Ambiguo").slice(0, 160),
    manipulationFlags: normalizeFlags(payload?.manipulationFlags),
    verdict: String(payload?.verdict || "No se pudo generar un veredicto claro.").slice(0, 700),
    analysisMode: modeId,
  };
}

function normalizeRelationshipResult(payload) {
  const reciprocityLevel = clampScore(payload?.reciprocityLevel);
  const interestScore = clampScore(payload?.interestScore ?? reciprocityLevel);
  const redFlags = Array.isArray(payload?.redFlags)
    ? payload.redFlags.map((flag) => String(flag || "").trim()).filter(Boolean).slice(0, 5)
    : [];

  let badge = String(payload?.badge || "").trim();
  if (!badge) {
    if (reciprocityLevel >= 75) badge = "Interes mutuo";
    else if (reciprocityLevel >= 45) badge = "Zona de confusion";
    else badge = "Relacion desequilibrada";
  }

  return {
    diagnosis: String(payload?.diagnosis || "No se pudo generar un diagnostico claro.").slice(0, 900),
    reciprocityLevel,
    redFlags,
    interestScore,
    recommendation: String(payload?.recommendation || "Habla con claridad y evalua coherencia entre palabras y acciones.").slice(0, 400),
    badge,
    highlight: String(payload?.highlight || "Tu energia emocional merece reciprocidad real.").slice(0, 220),
    analysisMode: "modo_terapeuta",
  };
}

function buildPrompt(chatText, mode) {
  return `Analiza la siguiente conversacion y responde SOLO JSON valido.

Objetivo:
- Detectar: ghosting, gaslighting, desinteres, manipulacion emocional, senales mixtas.

Personalidad seleccionada:
- ${mode.name}: ${mode.description}
- Instruccion de tono: ${mode.promptTone}

Reglas:
- interestScore y honestyScore: enteros 0-100.
- emotionalTone: frase corta en espanol (max 12 palabras), emocional y clara.
- manipulationFlags: solo etiquetas exactas de esta lista:
  1) Posible ghosting
  2) Posible gaslighting
  3) Baja reciprocidad emocional
  4) Manipulacion emocional potencial
  5) Senales emocionales mixtas
- verdict: 2 a 4 frases segun la personalidad seleccionada.
- verdict: humano, claro y util; evita lenguaje robotico.
- verdict: incluye 1 consejo concreto y realista para el siguiente paso.
- Si la evidencia es debil, usa pocos flags o ninguno.

JSON esperado:
{
  "interestScore": number,
  "honestyScore": number,
  "emotionalTone": string,
  "manipulationFlags": string[],
  "verdict": string
}

Conversacion:
"""
${chatText}
"""`;
}

function buildRelationshipPrompt(answersText) {
  return `Analiza este test guiado sobre dinamica de pareja y responde SOLO JSON valido.

Objetivo:
- Dar un diagnostico emocional humano, directo y empatico.
- Detectar reciprocidad, consistencia y red flags.

Reglas:
- reciprocityLevel e interestScore: enteros 0-100.
- diagnosis: 3-5 frases utiles y aterrizadas.
- redFlags: lista corta de alertas puntuales (si hay).
- recommendation: una recomendacion clara y accionable.
- badge: solo uno de:
  1) Interes mutuo
  2) Zona de confusion
  3) Relacion desequilibrada
- highlight: frase corta, compartible y memorable.
- No diagnostiques salud mental.
- No uses lenguaje ofensivo.

JSON esperado:
{
  "diagnosis": string,
  "reciprocityLevel": number,
  "redFlags": string[],
  "interestScore": number,
  "recommendation": string,
  "badge": string,
  "highlight": string
}

Respuestas del test:
"""
${answersText}
"""`;
}

function answersToText(answers) {
  if (!answers || typeof answers !== "object") return "";
  return Object.entries(answers)
    .map(([key, value]) => `${key}: ${String(value || "").trim()}`)
    .join("\n");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(origin),
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "truthscan-openai-worker" }, 200, origin);
    }

    if (url.pathname !== "/analyze" && url.pathname !== "/relationship-check") {
      return json({ error: "Ruta no encontrada." }, 404, origin);
    }

    if (request.method !== "POST") {
      return json({ error: "Metodo no permitido." }, 405, origin);
    }

    try {
      const body = await request.json();
      const isRelationshipCheck = url.pathname === "/relationship-check";
      const modeConfig = getModeConfig(String(body?.mode || DEFAULT_ANALYSIS_MODE_ID));

      let userPrompt;
      let systemPrompt;

      if (isRelationshipCheck) {
        const answersText = answersToText(body?.answers);
        if (!answersText) {
          return json({ error: "Debes enviar respuestas del test." }, 400, origin);
        }
        userPrompt = buildRelationshipPrompt(answersText.slice(0, 4000));
        systemPrompt =
          "Eres un analista emocional experto en dinamicas de relacion. Habla con empatia, claridad y honestidad. Evita respuestas genericas y no diagnostiques.";
      } else {
        const inputText = String(body?.text || "").trim();
        if (!inputText) {
          return json({ error: "Debes enviar texto para analizar." }, 400, origin);
        }
        const limitedText = inputText.slice(0, 6000);
        userPrompt = buildPrompt(limitedText, modeConfig);
        systemPrompt = `Eres un analista emocional experto. Adapta todo tu tono al modo seleccionado: ${modeConfig.name}. ${modeConfig.promptTone}. Basate en evidencia textual y no inventes hechos ni diagnostiques.`;
      }

      if (!env.OPENAI_API_KEY) {
        return json({ error: "OPENAI_API_KEY no configurada en Worker." }, 500, origin);
      }

      const model = env.OPENAI_MODEL || "gpt-4o-mini";

      const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 320,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      });

      if (!openAiResponse.ok) {
        const rawError = await openAiResponse.text();
        return json({ error: `OpenAI error: ${rawError.slice(0, 300)}` }, 502, origin);
      }

      const completion = await openAiResponse.json();
      const rawContent = completion?.choices?.[0]?.message?.content || "{}";

      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        return json({ error: "La respuesta de IA no llego en formato JSON valido." }, 502, origin);
      }

      if (url.pathname === "/relationship-check") {
        return json(normalizeRelationshipResult(parsed), 200, origin);
      }

      return json(normalizeResult(parsed, modeConfig.id), 200, origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al analizar.";
      return json({ error: message }, 500, origin);
    }
  },
};
