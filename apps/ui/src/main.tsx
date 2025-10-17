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
import "../styles/animations.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
} else {
  console.error("L'élément root n'a pas été trouvé dans le DOM");
}
