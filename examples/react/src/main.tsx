import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { startDarkroom } from "example-shared/darkroom/runtime/startDarkroom";
import { Application } from "src/Application";
import "src/styles.css";

const root = document.getElementById("root");

if (root === null) {
  throw new Error("The page has no #root element.");
}

const { services, runtime } = startDarkroom({ latency: 400 });

createRoot(root).render(
  <StrictMode>
    <Application services={services} runtime={runtime} />
  </StrictMode>,
);
