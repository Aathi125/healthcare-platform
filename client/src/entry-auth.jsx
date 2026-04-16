import React from "react";
import { createRoot } from "react-dom/client";
import { PlatformChrome } from "./shared/PlatformChrome.jsx";
import App from "../auth-frontend/src/App.jsx";
import "../auth-frontend/src/styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PlatformChrome activePage="auth">
      <App />
    </PlatformChrome>
  </React.StrictMode>
);
