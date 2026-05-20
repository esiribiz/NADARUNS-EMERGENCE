import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import { storage } from "./utils/storage";
import { darkPalette, lightPalette, Palette } from "./theme";

type Mode = "light" | "dark" | "system";

interface ThemeCtx {
  mode: Mode;
  effective: "light" | "dark";
  colors: Palette;
  setMode: (m: Mode) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = "@nadaruns/theme-mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");
  const [systemMode, setSystemMode] = useState<"light" | "dark">(
    Appearance.getColorScheme() === "dark" ? "dark" : "light",
  );

  // Initial load
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem(STORAGE_KEY, "light");
      if (saved === "dark" || saved === "light" || saved === "system") {
        setModeState(saved);
      }
    })();
  }, []);

  // System color scheme listener
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemMode(colorScheme === "dark" ? "dark" : "light");
    });
    return () => sub.remove();
  }, []);

  const effective: "light" | "dark" = mode === "system" ? systemMode : mode;
  const colors = effective === "dark" ? darkPalette : lightPalette;

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    storage.setItem(STORAGE_KEY, m);
  }, []);

  const value = useMemo(() => ({ mode, effective, colors, setMode }), [mode, effective, colors, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback when used outside provider (e.g. legacy screens not yet migrated):
    // return light palette without writing to storage.
    return { mode: "light", effective: "light", colors: lightPalette, setMode: () => {} };
  }
  return ctx;
}

export function useColors(): Palette {
  return useTheme().colors;
}
