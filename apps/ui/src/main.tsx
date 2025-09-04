import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Import des styles DSFR
import "@gouvfr/dsfr/dist/dsfr.min.css";
import "@gouvfr/dsfr/dist/utility/utility.min.css";

// Import des scripts DSFR
import "@gouvfr/dsfr/dist/dsfr.module.min.js";

// Import styles custom
import "../styles/index.css";
import { DsfrProvider } from "./providers/dsfr/DsfrProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DsfrProvider>
        <App />
      </DsfrProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
