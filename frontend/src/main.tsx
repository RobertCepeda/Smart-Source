import { StrictMode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient();
const storedPreferences = localStorage.getItem("smart_source_preferences");

if (storedPreferences) {
  try {
    const preferences = JSON.parse(storedPreferences) as { appearance?: "light" | "dark" };
    document.documentElement.dataset.theme = preferences.appearance ?? "light";
  } catch {
    document.documentElement.dataset.theme = "light";
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
