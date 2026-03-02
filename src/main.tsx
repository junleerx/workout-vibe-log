import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineProvider } from "./context/OfflineContext";
import "./index.css";

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[Main] Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('[Main] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <OfflineProvider>
      <App />
    </OfflineProvider>
  </ErrorBoundary>
);
