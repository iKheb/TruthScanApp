function resolveApiUrl(rawUrl) {
  const base = String(rawUrl || "").trim();
  if (!base) return "";
  if (base.endsWith("/analyze")) return base;
  return `${base.replace(/\/+$/, "")}/analyze`;
}

const API_URL = resolveApiUrl(import.meta.env.VITE_OPENAI_ANALYSIS_API_URL);

function clampNumber(value, min, max) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function normalizeFlags(flags) {
  if (!Array.isArray(flags)) return [];

  return flags
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeResult(payload) {
  return {
    interestScore: clampNumber(payload?.interestScore, 0, 100),
    honestyScore: clampNumber(payload?.honestyScore, 0, 100),
    emotionalTone: String(payload?.emotionalTone || "Indefinido").slice(0, 160),
    manipulationFlags: normalizeFlags(payload?.manipulationFlags),
    verdict: String(payload?.verdict || "No se pudo generar un veredicto.").slice(0, 700),
    analysisMode: String(payload?.analysisMode || "brutal_honesto"),
  };
}

export async function runConversationAnalysis(chatText, modeId = "brutal_honesto") {
  const text = String(chatText || "").trim();
  if (!text) {
    throw new Error("Debes pegar una conversacion antes de analizar.");
  }

  if (!API_URL) {
    throw new Error("Configura VITE_OPENAI_ANALYSIS_API_URL con la URL de tu Worker.");
  }

  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, mode: modeId }),
    });
  } catch {
    throw new Error(`No se pudo conectar con el servicio IA (${API_URL}).`);
  }

  if (!response.ok) {
    let message = "No fue posible analizar la conversacion en este momento.";
    try {
      const errorPayload = await response.json();
      if (errorPayload?.error) {
        message = String(errorPayload.error);
      }
    } catch {
      // Keep generic message.
    }
    throw new Error(message);
  }

  const payload = await response.json();
  return normalizeResult(payload);
}
