import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { RoleProvider } from "./context/RoleContext";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/dashboard.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <RoleProvider>
      <App />
    </RoleProvider>
  </StrictMode>,
);
