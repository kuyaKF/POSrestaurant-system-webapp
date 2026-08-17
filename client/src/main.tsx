import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CurrentStaffProvider } from "./context/CurrentStaffContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <CurrentStaffProvider>
        <App />
      </CurrentStaffProvider>
    </BrowserRouter>
  </StrictMode>
);
