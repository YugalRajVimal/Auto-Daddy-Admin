import { useEffect } from "react";
import { useLocation } from "react-router";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Clear scroll locks left by modals/previews (e.g. CarBrands, Modal component).
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}
