const ANALYTICS_PROVIDER = String(import.meta.env.VITE_ANALYTICS_PROVIDER || "none").toLowerCase();
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const RETENTION_KEY = "truthscan_retention_meta_v1";

let initialized = false;
let posthogClient = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function canUseProvider() {
  if (ANALYTICS_PROVIDER === "posthog") return Boolean(POSTHOG_KEY);
  if (ANALYTICS_PROVIDER === "ga4") return Boolean(GA_MEASUREMENT_ID);
  return false;
}

function loadGaScript(measurementId) {
  if (!isBrowser()) return;
  if (window.gtag) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: true });
}

function trackRetention() {
  if (!isBrowser()) return;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let meta = null;
  try {
    meta = JSON.parse(localStorage.getItem(RETENTION_KEY) || "null");
  } catch {
    meta = null;
  }

  if (!meta) {
    const first = { firstSeenAt: now, lastSeenAt: now, visits: 1 };
    localStorage.setItem(RETENTION_KEY, JSON.stringify(first));
    trackAnalyticsEvent("retention_by_user", {
      visits: 1,
      returning_user: false,
      days_since_last_visit: 0,
      days_since_first_visit: 0,
    });
    return;
  }

  const daysSinceLast = Math.max(0, Math.floor((now - Number(meta.lastSeenAt || now)) / dayMs));
  const daysSinceFirst = Math.max(0, Math.floor((now - Number(meta.firstSeenAt || now)) / dayMs));
  const visits = Number(meta.visits || 0) + 1;

  const next = { firstSeenAt: Number(meta.firstSeenAt || now), lastSeenAt: now, visits };
  localStorage.setItem(RETENTION_KEY, JSON.stringify(next));

  trackAnalyticsEvent("retention_by_user", {
    visits,
    returning_user: visits > 1,
    days_since_last_visit: daysSinceLast,
    days_since_first_visit: daysSinceFirst,
  });
}

export async function initAnalytics() {
  if (initialized || !isBrowser() || !canUseProvider()) return;
  initialized = true;

  if (ANALYTICS_PROVIDER === "posthog") {
    const posthogModule = await import("posthog-js");
    posthogClient = posthogModule.default;
    posthogClient.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      autocapture: true,
    });
    trackRetention();
    return;
  }

  if (ANALYTICS_PROVIDER === "ga4") {
    loadGaScript(GA_MEASUREMENT_ID);
    trackRetention();
  }
}

export function identifyAnalyticsUser(userId, userProps = {}) {
  if (!canUseProvider() || !userId) return;

  if (ANALYTICS_PROVIDER === "posthog" && posthogClient) {
    posthogClient.identify(String(userId), userProps);
    return;
  }

  if (ANALYTICS_PROVIDER === "ga4" && window.gtag) {
    window.gtag("set", "user_id", String(userId));
    if (Object.keys(userProps).length > 0) {
      window.gtag("set", "user_properties", userProps);
    }
  }
}

export function trackAnalyticsEvent(eventName, props = {}) {
  if (!canUseProvider() || !eventName) return;

  if (ANALYTICS_PROVIDER === "posthog" && posthogClient) {
    posthogClient.capture(eventName, props);
    return;
  }

  if (ANALYTICS_PROVIDER === "ga4" && window.gtag) {
    window.gtag("event", eventName, props);
  }
}
