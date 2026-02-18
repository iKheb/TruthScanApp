import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const OPENAI_MODEL = defineSecret("OPENAI_MODEL");

const ALLOWED_FLAGS = [
  "Posible ghosting",
  "Posible gaslighting",
  "Baja reciprocidad emocional",
  "Manipulacion emocional potencial",
  "Senales emocionales mixtas",
];

function clampScore(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeFlags(flags) {
  if (!Array.isArray(flags)) return [];
  return flags
    .map((item) => String(item || "").trim())
    .filter((flag) => ALLOWED_FLAGS.includes(flag))
    .slice(0, 5);
}

function normalizeAnalysis(payload) {
  const interestScore = clampScore(payload?.interestScore);
  const honestyScore = clampScore(payload?.honestyScore);
  const emotionalTone = String(payload?.emotionalTone || "Ambiguo").slice(0, 160);
  const verdict = String(payload?.verdict || "No se pudo generar un veredicto claro.").slice(0, 700);
  const manipulationFlags = normalizeFlags(payload?.manipulationFlags);

  return {
    interestScore,
    honestyScore,
    emotionalTone,
    manipulationFlags,
    verdict,
  };
}

function buildPrompt(chatText) {
  return `Analiza esta conversacion de chat y responde SOLO JSON valido.

Objetivo:
- Detectar patrones de: ghosting, gaslighting, desinteres, manipulacion emocional, senales mixtas.
- Generar un veredicto humano, claro y breve.

Reglas:
- interestScore y honestyScore en rango 0-100.
- emotionalTone: frase corta en espanol (max 12 palabras).
- manipulationFlags: solo puede contener etiquetas de esta lista exacta:
  1) Posible ghosting
  2) Posible gaslighting
  3) Baja reciprocidad emocional
  4) Manipulacion emocional potencial
  5) Senales emocionales mixtas
- verdict: 1 a 3 frases, tono humano, accionable y sin diagnosticos medicos.
- Si no hay evidencia fuerte, usa pocos flags o ninguno.

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

export const analyzeConversation = onRequest(
  {
    region: "us-central1",
    cors: true,
    timeoutSeconds: 30,
    memory: "256MiB",
    maxInstances: 15,
    secrets: [OPENAI_API_KEY, OPENAI_MODEL],
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Metodo no permitido." });
      return;
    }

    try {
      const inputText = String(req.body?.text || "").trim();
      if (!inputText) {
        res.status(400).json({ error: "Debes enviar texto para analizar." });
        return;
      }

      const limitedText = inputText.slice(0, 6000);
      const apiKey = OPENAI_API_KEY.value();
      const model = OPENAI_MODEL.value() || "gpt-4o-mini";

      const client = new OpenAI({ apiKey });

      const completion = await client.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 260,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Eres un analista de dinamicas conversacionales. Prioriza precision, brevedad y evidencia textual. Nunca inventes hechos.",
          },
          {
            role: "user",
            content: buildPrompt(limitedText),
          },
        ],
      });

      const rawContent = completion.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(rawContent);
      const normalized = normalizeAnalysis(parsed);

      res.status(200).json(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al analizar.";
      res.status(500).json({ error: `Fallo el analisis con IA: ${message}` });
    }
  },
);