import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AdminAuthProvider } from "./context/AdminAuthContext";

createRoot(document.getElementById("root")!).render(
  <AdminAuthProvider>
    <App />
  </AdminAuthProvider>
);
