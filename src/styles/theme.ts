// Theme constants for Pulse Ops
// These values mirror what's defined in global.css @theme
// Use these for any programmatic access to theme values

export const colors = {
  primary: {
    DEFAULT: "#1976D2",
    dark: "#0D47A1",
    light: "#42A5FA",
    foreground: "#FFFFFF",
  },
  accent: {
    DEFAULT: "#FF9800",
    light: "#FFB74D",
    foreground: "#FFFFFF",
  },
  success: {
    DEFAULT: "#43A047",
    light: "#66BB6A",
  },
  warning: {
    DEFAULT: "#FB8C00",
    light: "#FFA726",
  },
  error: {
    DEFAULT: "#E53935",
    light: "#EF5350",
  },
  info: {
    DEFAULT: "#2196F3",
  },
  background: "#F5F7FA",
  surface: "#FFFFFF",
  foreground: {
    DEFAULT: "#2C3E50",
    secondary: "#78909C",
    tertiary: "#546E7A",
  },
  border: {
    DEFAULT: "#E0E0E0",
    light: "#F0F0F0",
  },
  muted: {
    DEFAULT: "#F5F7FA",
    foreground: "#78909C",
  },
} as const;

export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
} as const;

export const borderRadius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 2px 4px rgba(0, 0, 0, 0.05)",
  md: "0 2px 8px rgba(0, 0, 0, 0.08)",
  lg: "0 8px 20px rgba(0, 0, 0, 0.12)",
  primary: "0 4px 12px rgba(33, 150, 243, 0.4)",
} as const;

export const fontFamily = {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

export const fontSize = {
  xs: "12px",
  sm: "14px",
  base: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "28px",
} as const;
