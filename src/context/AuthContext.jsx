import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { identifyAnalyticsUser } from "../services/analytics";
import { auth, ensureUserProfile, getDailyQuotaStatus, loginWithGoogle, logoutFromGoogle } from "../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("free");
  const [quota, setQuota] = useState({ used: 0, limit: 3, remaining: 3 });

  const refreshPlanAndQuota = async () => {
    if (!auth?.currentUser?.uid) {
      setPlan("free");
      setQuota({ used: 0, limit: 3, remaining: 3 });
      return;
    }
    try {
      const profile = await ensureUserProfile();
      setPlan(String(profile.plan || "free"));
      const status = await getDailyQuotaStatus();
      setQuota(status);
    } catch {
      // Silent fallback.
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser || null);
      setLoading(false);
      if (nextUser?.uid) {
        identifyAnalyticsUser(nextUser.uid, { auth_type: "google" });
      }
      await refreshPlanAndQuota();
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    setError("");
    const nextUser = await loginWithGoogle();
    setUser(nextUser || null);
    await refreshPlanAndQuota();
    return nextUser;
  };

  const logout = async () => {
    setError("");
    await logoutFromGoogle();
    setUser(null);
    setPlan("free");
    setQuota({ used: 0, limit: 3, remaining: 3 });
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      setError,
      login,
      logout,
      isAuthenticated: Boolean(user),
      plan,
      quota,
      refreshPlanAndQuota,
    }),
    [user, loading, error, plan, quota],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return context;
}
