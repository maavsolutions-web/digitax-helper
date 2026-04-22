import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Individual portal uses dark hybrid theme. CA portal (/mitra/*, /ca/*) uses light productivity theme.
const DARK_PREFIXES = ["/upload", "/processing", "/report", "/checkout", "/signup", "/profile"];

export const ThemeByRoute = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const isDark = DARK_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [pathname]);

  return null;
};
