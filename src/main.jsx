import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AnalysisModeProvider } from "./context/AnalysisModeContext";
import { AuthProvider } from "./context/AuthContext";
import { APP_NAME } from "./lib/appConfig";
import { initAnalytics } from "./services/analytics";
import "./style.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("No se encontro #app en index.html");
}

initAnalytics();
if (!document.title || document.title.includes("%VITE_APP_NAME%")) {
  document.title = `${APP_NAME} — Detector de Mentiras en Chats con IA`;
}

const setMeta = (selector, key, keyValue, content) => {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(key, keyValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

setMeta('meta[property="og:title"]', "property", "og:title", `${APP_NAME} — Detector de Mentiras en Chats con IA`);
setMeta('meta[property="twitter:title"]', "property", "twitter:title", `${APP_NAME} — Detector de Mentiras en Chats con IA`);

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <AnalysisModeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AnalysisModeProvider>
    </AuthProvider>
  </StrictMode>,
);
