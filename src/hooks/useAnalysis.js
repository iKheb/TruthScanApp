import { onAuthStateChanged } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runConversationAnalysis } from "../services/analysisEngine";
import { identifyAnalyticsUser, trackAnalyticsEvent } from "../services/analytics";
import { auth, consumeDailyAnalysisQuota, getSessionHistory, isFirebaseConfigured, saveAnalysis } from "../services/firebase";

const CACHE_KEY = "truthscan_history_cache";
const CHAT_CACHE_PREFIX = "truthscan_chat_";

function cacheOriginalChat(analysisId, text) {
  if (!analysisId || !text) return;
  sessionStorage.setItem(`${CHAT_CACHE_PREFIX}${analysisId}`, text);
}

export function getCachedChatByAnalysisId(analysisId) {
  if (!analysisId) return "";
  return sessionStorage.getItem(`${CHAT_CACHE_PREFIX}${analysisId}`) || "";
}

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [lastSavedId, setLastSavedId] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setHistory(JSON.parse(cached));
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, []);

  const persistHistory = useCallback((items) => {
    setHistory(items);
    localStorage.setItem(CACHE_KEY, JSON.stringify(items));
  }, []);

  const createLocalEntry = useCallback(
    ({ text, normalized, storeFullText, source }) => {
      const offlineId = `local-${Date.now()}`;
      cacheOriginalChat(offlineId, text);

      const offlineEntry = {
        id: offlineId,
        text: storeFullText ? text : "[oculto por privacidad]",
        ...normalized,
        createdAt: new Date().toISOString(),
      };
      persistHistory([offlineEntry, ...history].slice(0, 8));
      setLastSavedId(offlineId);

      trackAnalyticsEvent("result_generated", {
        source,
        analysis_id: offlineId,
        interest_score: normalized.interestScore,
        honesty_score: normalized.honestyScore,
        flags_count: normalized.manipulationFlags?.length || 0,
        mode_id: normalized.analysisMode,
      });

      return { ...normalized, id: offlineId };
    },
    [history, persistHistory],
  );

  const runAnalysis = useCallback(
    async (text, options = {}) => {
      const storeFullText = Boolean(options.storeFullText);
      const modeId = String(options.modeId || "brutal_honesto");

      setError("");
      setLoading(true);
      setLastSavedId("");

      trackAnalyticsEvent("analysis_started", {
        text_length: text.length,
        mode_id: modeId,
      });

      try {
        const analysis = await runConversationAnalysis(text, modeId);
        const normalized = { ...analysis, analysisMode: analysis.analysisMode || modeId };
        setResult(normalized);

        if (!isFirebaseConfigured) {
          return createLocalEntry({ text, normalized, storeFullText, source: "local_no_firebase" });
        }

        const user = auth?.currentUser || null;
        if (!user?.uid) {
          return createLocalEntry({ text, normalized, storeFullText, source: "local_no_auth" });
        }

        try {
          await consumeDailyAnalysisQuota();
        } catch (quotaError) {
          if (String(quotaError?.message || "").includes("FREE_LIMIT_REACHED")) {
            throw new Error("Has alcanzado tu limite gratis de 3 analisis hoy. Actualiza a Pro para continuar.");
          }
          throw quotaError;
        }

        identifyAnalyticsUser(user.uid, { auth_type: "google" });

        const id = await saveAnalysis({
          text: storeFullText ? text : "[oculto por privacidad]",
          ...normalized,
        });
        cacheOriginalChat(id, text);
        setLastSavedId(id);

        const updatedHistory = [
          {
            id,
            text: storeFullText ? text : "[oculto por privacidad]",
            ...normalized,
            createdAt: new Date().toISOString(),
          },
          ...history,
        ].slice(0, 8);
        persistHistory(updatedHistory);

        trackAnalyticsEvent("result_generated", {
          source: "firebase",
          analysis_id: id,
          interest_score: normalized.interestScore,
          honesty_score: normalized.honestyScore,
          flags_count: normalized.manipulationFlags?.length || 0,
          mode_id: normalized.analysisMode,
        });

        return { ...normalized, id };
      } catch (runError) {
        setError(runError.message || "No fue posible analizar la conversacion.");
        trackAnalyticsEvent("analysis_failed", {
          message: runError?.message || "unknown",
          mode_id: modeId,
        });
        throw runError;
      } finally {
        setLoading(false);
      }
    },
    [createLocalEntry, history, persistHistory],
  );

  const refreshHistory = useCallback(async () => {
    if (!isFirebaseConfigured || !auth?.currentUser?.uid) return;

    try {
      const user = auth.currentUser;
      identifyAnalyticsUser(user.uid, { auth_type: "google" });

      const cloudHistory = await getSessionHistory();
      if (cloudHistory.length > 0) {
        const normalized = cloudHistory.map((entry) => ({
          id: entry.id,
          text: entry.text,
          interestScore: entry.scores?.interestScore ?? 0,
          honestyScore: entry.scores?.honestyScore ?? 0,
          manipulationFlags: entry.flags ?? [],
          verdict: entry.verdict,
          emotionalTone: entry.emotionalTone,
          analysisMode: entry.analysisMode || "brutal_honesto",
          createdAt: entry.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        }));

        persistHistory(normalized);
      }
    } catch {
      // Keep local cache as fallback.
    }
  }, [persistHistory]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    if (!auth) return undefined;
    const unsubscribe = onAuthStateChanged(auth, () => {
      refreshHistory();
    });
    return unsubscribe;
  }, [refreshHistory]);

  const hasHistory = useMemo(() => history.length > 0, [history]);

  return {
    loading,
    error,
    result,
    history,
    hasHistory,
    lastSavedId,
    runAnalysis,
  };
}
