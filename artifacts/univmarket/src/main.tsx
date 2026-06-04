import { createRoot } from "react-dom/client";
import "@/i18n";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

setBaseUrl(import.meta.env.VITE_API_URL || "");

// Toujours lire le token le plus recent depuis localStorage
setAuthTokenGetter(() => {
  return localStorage.getItem("univmarket_token");
});

createRoot(document.getElementById("root")!).render(<App />);
