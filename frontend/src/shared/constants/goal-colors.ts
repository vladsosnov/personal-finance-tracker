export const GOAL_COLOR_OPTIONS = [
  { value: "#0F766E", label: "Teal" },
  { value: "#2563EB", label: "Blue" },
  { value: "#7C3AED", label: "Violet" },
  { value: "#DB2777", label: "Pink" },
  { value: "#DC2626", label: "Red" },
  { value: "#EA580C", label: "Orange" },
  { value: "#CA8A04", label: "Amber" },
  { value: "#16A34A", label: "Green" },
] as const;

export const DEFAULT_GOAL_COLOR = GOAL_COLOR_OPTIONS[0].value;

export const GOAL_COLOR_VALUES = GOAL_COLOR_OPTIONS.map((option) => option.value);
