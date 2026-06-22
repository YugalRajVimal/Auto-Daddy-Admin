import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import { AuthSetup } from "./auth/AuthSetup.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <AuthProvider>
          <AuthSetup>
            <App />
          </AuthSetup>
        </AuthProvider>
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>,
);
