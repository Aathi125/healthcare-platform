import React from "react";
import { createRoot } from "react-dom/client";
import { PlatformChrome } from "./shared/PlatformChrome.jsx";
import App from "../telemedicine-frontend/src/App.jsx";
import "../telemedicine-frontend/src/styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PlatformChrome activePage="consult">
      <App />
    </PlatformChrome>
  </React.StrictMode>
);
