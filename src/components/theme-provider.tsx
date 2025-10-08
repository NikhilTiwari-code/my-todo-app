"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  const applyTheme = useCallback((value: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    const isDark = value === "dark";

    // Force remove/add to ensure it applies
    if (isDark) {
      root.classList.remove("light");
      root.classList.add("dark");
      body?.classList.remove("light");
      body?.classList.add("dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      body?.classList.remove("dark");
      body?.classList.add("light");
    }

    root.style.colorScheme = isDark ? "dark" : "light";
  }, []);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = prefersDark ? "dark" : "light";
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme: Theme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", nextTheme);
      applyTheme(nextTheme);
      return nextTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
