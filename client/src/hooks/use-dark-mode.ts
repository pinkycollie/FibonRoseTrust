import { useState, useEffect } from "react";

interface UseDarkModeReturn {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export function useDarkMode(): UseDarkModeReturn {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check for saved preference
    if (typeof window !== "undefined" && window.localStorage) {
      const storedPreference = window.localStorage.getItem("darkMode");
      if (storedPreference !== null) {
        return storedPreference === "true";
      }
      
      // If no preference is saved, use system preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    // Update document class when dark mode changes
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Save preference to localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("darkMode", isDarkMode.toString());
    }
  }, [isDarkMode]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const hasStoredPreference = window.localStorage.getItem("darkMode") !== null;
      if (!hasStoredPreference) {
        setIsDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  return { isDarkMode, toggleDarkMode, setDarkMode };
}
