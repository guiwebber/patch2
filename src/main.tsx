import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "../pages/home/home.tsx";
import MenuBar from "./components/menu/menu.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MenuBar />
    <Home />
  </StrictMode>,
);
