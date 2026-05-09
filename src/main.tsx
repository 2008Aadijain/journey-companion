import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { envSchema } from "./lib/schemas.ts";
import "./index.css";

// Validate environment variables
try {
  envSchema.parse(import.meta.env);
} catch (error) {
  console.error('Environment validation failed:', error);
  // In development, show a helpful error message
  if (import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="font-family: monospace; padding: 20px; color: red;">
        <h1>Environment Configuration Error</h1>
        <p>Please check your .env file and ensure all required variables are set:</p>
        <ul>
          <li>VITE_SUPABASE_URL - Your Supabase project URL</li>
          <li>VITE_SUPABASE_ANON_KEY - Your Supabase anonymous key</li>
          <li>VITE_SUPABASE_REDIRECT_URL - OAuth redirect URL (optional)</li>
        </ul>
        <p>Copy from .env.example and fill in your actual values.</p>
      </div>
    `;
    throw error;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
