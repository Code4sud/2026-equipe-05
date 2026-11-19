import React from "react";
import { createRoot } from "react-dom/client";
import GameplayPrototype from "./components/gameplay/GameplayPrototype";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GameplayPrototype />
  </React.StrictMode>
);