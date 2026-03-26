import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LifestylePlan from "./lifestyle-plan";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LifestylePlan />
  </StrictMode>
);
