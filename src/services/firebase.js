import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, browserLocalPersistence, getAuth, setPersistence, signInWithPopup, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB7Oj61Q5H_z0L91Ky2M6_Lem5T40m2zWw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "animag-c3759.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "animag-c3759",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "animag-c3759.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "3784764683",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:3784764683:web:89a0a55cd3bef468a4860e",
};

const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
const USAGE_LIMITS_ENABLED = String(import.meta.env.VITE_ENABLE_USAGE_LIMITS || "false").toLowerCase() === "true";

let auth;
let db;
let googleProvider;

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Ignore persistence errors and use default behavior.
  });
}

export { auth, db, isFirebaseConfigured };

function isPermissionDenied(error) {
  return String(error?.code || "").includes("permission-denied");
}

export async function loginWithGoogle() {
  if (!auth || !googleProvider) throw new Error("Firebase Auth no esta configurado.");
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function logoutFromGoogle() {
  if (!auth) return;
  await signOut(auth);
}

function getAuthenticatedUserOrThrow() {
  const user = auth?.currentUser;
  if (!user?.uid) throw new Error("Inicia sesion con Google para continuar.");
  return user;
}

export function getCurrentUser() {
  return auth?.currentUser || null;
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function ensureUserProfile() {
  if (!db) throw new Error("Firebase no configurado.");
  const user = getAuthenticatedUserOrThrow();
  const userRef = doc(db, "users", user.uid);
  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (error) {
    if (isPermissionDenied(error)) {
      return { userId: user.uid, plan: "free", degraded: true };
    }
    throw error;
  }

  if (!userSnap.exists()) {
    try {
      await setDoc(userRef, {
        userId: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        plan: "free",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { userId: user.uid, plan: "free" };
    } catch (error) {
      if (isPermissionDenied(error)) {
        return { userId: user.uid, plan: "free", degraded: true };
      }
      throw error;
    }
  }

  const data = userSnap.data();
  return {
    userId: user.uid,
    ...data,
    plan: data?.plan || "free",
  };
}

export async function getUserPlan() {
  const profile = await ensureUserProfile();
  return String(profile.plan || "free");
}

export async function getDailyQuotaStatus() {
  if (!db) throw new Error("Firebase no configurado.");
  const user = getAuthenticatedUserOrThrow();
  const plan = await getUserPlan();
  if (!USAGE_LIMITS_ENABLED) {
    return { plan, used: 0, limit: null, remaining: null, disabled: true };
  }
  const limitPerDay = plan === "pro" ? Number.POSITIVE_INFINITY : 3;
  const usageRef = doc(db, "users", user.uid, "daily_usage", getTodayKey());
  let usageSnap;
  try {
    usageSnap = await getDoc(usageRef);
  } catch (error) {
    if (isPermissionDenied(error)) {
      return { plan, used: 0, limit: Number.isFinite(limitPerDay) ? limitPerDay : null, remaining: Number.isFinite(limitPerDay) ? limitPerDay : null };
    }
    throw error;
  }
  const used = Number(usageSnap.data()?.count || 0);

  return {
    plan,
    used,
    limit: Number.isFinite(limitPerDay) ? limitPerDay : null,
    remaining: Number.isFinite(limitPerDay) ? Math.max(0, limitPerDay - used) : null,
  };
}

export async function consumeDailyAnalysisQuota() {
  if (!db) throw new Error("Firebase no configurado.");
  const user = getAuthenticatedUserOrThrow();
  const plan = await getUserPlan();
  if (!USAGE_LIMITS_ENABLED) {
    return { plan, used: 0, remaining: null, limit: null, disabled: true };
  }
  if (plan === "pro") return { plan, used: 0, remaining: null, limit: null };

  const usageRef = doc(db, "users", user.uid, "daily_usage", getTodayKey());
  let result;
  try {
    result = await runTransaction(db, async (transaction) => {
      const usageSnap = await transaction.get(usageRef);
      const current = Number(usageSnap.data()?.count || 0);
      if (current >= 3) {
        throw new Error("FREE_LIMIT_REACHED");
      }

      transaction.set(
        usageRef,
        {
          dateKey: getTodayKey(),
          count: current + 1,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      return current + 1;
    });
  } catch (error) {
    if (String(error?.message || "").includes("FREE_LIMIT_REACHED")) {
      throw error;
    }
    if (isPermissionDenied(error)) {
      return { plan: "free", used: 0, limit: 3, remaining: 3, degraded: true };
    }
    throw error;
  }

  return {
    plan: "free",
    used: result,
    limit: 3,
    remaining: Math.max(0, 3 - result),
  };
}

export async function saveAnalysis(payload) {
  if (!db) throw new Error("Firebase no configurado.");
  const user = getAuthenticatedUserOrThrow();

  const ref = await addDoc(collection(db, "analyses"), {
    userId: user.uid,
    text: payload.text,
    scores: {
      interestScore: payload.interestScore,
      honestyScore: payload.honestyScore,
    },
    flags: payload.manipulationFlags,
    verdict: payload.verdict,
    emotionalTone: payload.emotionalTone,
    analysisMode: payload.analysisMode || "brutal_honesto",
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function getAnalysisById(id) {
  if (!db) throw new Error("Firebase no configurado.");

  const snap = await getDoc(doc(db, "analyses", id));
  if (!snap.exists()) return null;

  return { id: snap.id, ...snap.data() };
}

export async function getSessionHistory(limitCount = 8) {
  if (!db) throw new Error("Firebase no configurado.");
  const user = getAuthenticatedUserOrThrow();

  const q = query(
    collection(db, "analyses"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );

  const snap = await getDocs(q);
  return snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export async function savePersonAnalysis({ personName, chatText, analysis }) {
  if (!db) throw new Error("Firebase no configurado.");
  const user = getAuthenticatedUserOrThrow();

  const trimmedName = String(personName || "").trim();
  if (!trimmedName) throw new Error("Debes asignar un nombre para guardar esta persona.");

  const nameNormalized = trimmedName.toLowerCase();
  const peopleCollection = collection(db, "saved_people");

  const existingQuery = query(
    peopleCollection,
    where("userId", "==", user.uid),
    where("nameNormalized", "==", nameNormalized),
    limit(1),
  );
  const existingSnap = await getDocs(existingQuery);

  let personRef;

  if (existingSnap.empty) {
    const personDoc = await addDoc(peopleCollection, {
      userId: user.uid,
      name: trimmedName,
      nameNormalized,
      analysesCount: 1,
      createdAt: serverTimestamp(),
      lastAnalysisAt: serverTimestamp(),
    });
    personRef = personDoc;
  } else {
    personRef = existingSnap.docs[0].ref;
    await updateDoc(personRef, {
      name: trimmedName,
      analysesCount: increment(1),
      lastAnalysisAt: serverTimestamp(),
    });
  }

  const analysisDoc = await addDoc(collection(personRef, "analyses"), {
    chatText: String(chatText || "[oculto por privacidad]"),
    result: {
      interestScore: analysis.interestScore,
      honestyScore: analysis.honestyScore,
      emotionalTone: analysis.emotionalTone,
      manipulationFlags: analysis.manipulationFlags || [],
      verdict: analysis.verdict,
      analysisMode: analysis.analysisMode || "brutal_honesto",
    },
    createdAt: serverTimestamp(),
  });
  return { personId: personRef.id, analysisId: analysisDoc.id };
}

export async function getSavedPeople(limitCount = 50) {
  if (!db) throw new Error("Firebase no configurado.");
  const user = getAuthenticatedUserOrThrow();

  const q = query(
    collection(db, "saved_people"),
    where("userId", "==", user.uid),
    orderBy("lastAnalysisAt", "desc"),
    limit(limitCount),
  );

  const snap = await getDocs(q);
  return snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export async function getSavedPersonDetails(personId, limitCount = 40) {
  if (!db) throw new Error("Firebase no configurado.");
  const user = getAuthenticatedUserOrThrow();

  const personRef = doc(db, "saved_people", personId);
  const personSnap = await getDoc(personRef);
  if (!personSnap.exists()) throw new Error("Persona guardada no encontrada.");

  const person = { id: personSnap.id, ...personSnap.data() };
  if (person.userId !== user.uid) throw new Error("No tienes acceso a esta persona guardada.");

  const analysesQuery = query(collection(personRef, "analyses"), orderBy("createdAt", "desc"), limit(limitCount));
  const analysesSnap = await getDocs(analysesQuery);

  const analyses = analysesSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
  return { person, analyses };
}

export async function savePersonalityTestResult(payload) {
  if (!db) throw new Error("Firebase no configurado.");
  const user = getAuthenticatedUserOrThrow();
  const docPayload = {
    userId: user.uid,
    testId: String(payload?.testId || "personality_v1"),
    answers: payload?.answers || {},
    result: payload?.result || {},
    createdAt: serverTimestamp(),
  };

  try {
    const ref = await addDoc(collection(db, "personality_tests"), docPayload);
    return ref.id;
  } catch (error) {
    if (!isPermissionDenied(error)) throw error;

    // Backward-compatible fallback if rules for personality_tests are not yet deployed.
    const fallback = await addDoc(collection(db, "analyses"), {
      userId: user.uid,
      text: "[test personalidad]",
      scores: {
        interestScore: 0,
        honestyScore: 0,
      },
      flags: [],
      verdict: `Perfil: ${docPayload?.result?.name || "No definido"}`,
      emotionalTone: "Perfil relacional",
      analysisMode: "personality_test",
      meta: {
        testId: docPayload.testId,
        personalityResult: docPayload.result,
      },
      createdAt: serverTimestamp(),
    });
    return fallback.id;
  }
}
