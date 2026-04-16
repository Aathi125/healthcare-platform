import React from "react";
import { createRoot } from "react-dom/client";
import { PlatformChrome } from "./shared/PlatformChrome.jsx";

function HubPage() {
  return (
    <PlatformChrome activePage="hub" showHero>
      <section className="mc-hub-cards" aria-label="Applications">
        <a className="mc-hub-card" href="/auth.html">
          <h3>Sign in</h3>
          <p>
            Log in through the Auth service and receive a JWT—your digital ID with user id and role (patient, clinician,
            or admin).
          </p>
        </a>
        <a className="mc-hub-card" href="/consult.html">
          <h3>Virtual visit</h3>
          <p>
            Walk through the visit flow: create or join a session, then open video via Twilio or Jitsi. Streaming runs
            in your browser, not on our servers.
          </p>
        </a>
      </section>
    </PlatformChrome>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HubPage />
  </React.StrictMode>
);
