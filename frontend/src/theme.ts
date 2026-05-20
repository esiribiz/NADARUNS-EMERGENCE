import { Platform } from "react-native";

export interface Palette {
  background: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  primaryActive: string;
  primaryLight: string;
  secondary: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  routeLine: string;
  mapBg: string;
  mapGrid: string;
  mapRoad: string;
}

export const lightPalette: Palette = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  primary: "#0C4A42",
  primaryActive: "#147B6D",
  primaryLight: "#E6F2F0",
  secondary: "#0F172A",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textInverse: "#FFFFFF",
  border: "#E2E8F0",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  routeLine: "#0C4A42",
  mapBg: "#E8EDE8",
  mapGrid: "#D9E2DC",
  mapRoad: "#FFFFFF",
};

export const darkPalette: Palette = {
  background: "#0A0F0E",
  surface: "#141C1A",
  surfaceMuted: "#1E2826",
  primary: "#1BB5A0",
  primaryActive: "#34DDC2",
  primaryLight: "rgba(27, 181, 160, 0.16)",
  secondary: "#F8FAFC",
  textPrimary: "#F1F5F2",
  textSecondary: "#8FA8A2",
  textInverse: "#0A0F0E",
  border: "#1F2A28",
  success: "#34D399",
  warning: "#FBBF24",
  error: "#F87171",
  routeLine: "#34DDC2",
  mapBg: "#0E1413",
  mapGrid: "#1A2422",
  mapRoad: "#22302D",
};

// Legacy default export — light palette. New screens use `useTheme()` hook.
export const theme = lightPalette;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999,
};

export const shadows = {
  sm: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  lg: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 12 },
};

export const font = Platform.select({
  ios: "System", android: "sans-serif", default: "System",
}) as string;
