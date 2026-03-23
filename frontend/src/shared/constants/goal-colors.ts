export const GOAL_COLOR_OPTIONS = [
  { value: "#0F766E", label: "Deep Teal" },
  { value: "#0EA5E9", label: "Ocean Blue" },
  { value: "#2563EB", label: "Cobalt" },
  { value: "#4F46E5", label: "Indigo" },
  { value: "#7C3AED", label: "Violet" },
  { value: "#9333EA", label: "Amethyst" },
  { value: "#C026D3", label: "Orchid" },
  { value: "#DB2777", label: "Fuchsia" },
  { value: "#E11D48", label: "Rose Red" },
  { value: "#DC2626", label: "Crimson" },
  { value: "#EA580C", label: "Tangerine" },
  { value: "#F97316", label: "Orange" },
  { value: "#D97706", label: "Amber" },
  { value: "#CA8A04", label: "Goldenrod" },
  { value: "#65A30D", label: "Lime" },
  { value: "#16A34A", label: "Emerald" },
  { value: "#059669", label: "Jade" },
  { value: "#0891B2", label: "Cyan" },
  { value: "#0284C7", label: "Azure" },
  { value: "#BE123C", label: "Berry" },
] as const;

export const DEFAULT_GOAL_COLOR = GOAL_COLOR_OPTIONS[0].value;

export const GOAL_COLOR_VALUES = GOAL_COLOR_OPTIONS.map((option) => option.value);
