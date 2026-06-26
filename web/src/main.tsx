import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AssistantProvider } from "@/components/assistant/AssistantContext";
import { AuthProvider } from "@/lib/AuthContext";
import { TelegramProvider } from "@/lib/TelegramContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TelegramProvider>
      <AssistantProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AssistantProvider>
    </TelegramProvider>
  </StrictMode>
);