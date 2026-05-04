import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installCsrfFetch } from "./lib/install-csrf-fetch";

installCsrfFetch();

createRoot(document.getElementById("root")!).render(<App />);
