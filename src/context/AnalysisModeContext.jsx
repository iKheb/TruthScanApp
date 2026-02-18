import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ANALYSIS_MODES, DEFAULT_ANALYSIS_MODE_ID } from "../../shared/analysisModes";

const STORAGE_KEY = "truthscan_analysis_mode";
const AnalysisModeContext = createContext(null);

export function AnalysisModeProvider({ children }) {
  const [modeId, setModeId] = useState(DEFAULT_ANALYSIS_MODE_ID);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    if (ANALYSIS_MODES.some((mode) => mode.id === saved)) {
      setModeId(saved);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, modeId);
  }, [modeId]);

  const value = useMemo(
    () => ({
      modeId,
      setModeId,
      modes: ANALYSIS_MODES,
      selectedMode: ANALYSIS_MODES.find((mode) => mode.id === modeId) || ANALYSIS_MODES[0],
    }),
    [modeId],
  );

  return <AnalysisModeContext.Provider value={value}>{children}</AnalysisModeContext.Provider>;
}

export function useAnalysisMode() {
  const context = useContext(AnalysisModeContext);
  if (!context) throw new Error("useAnalysisMode debe usarse dentro de AnalysisModeProvider.");
  return context;
}
