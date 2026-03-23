export const GOAL_COLOR_OPTIONS = [
  { value: "#9ADBCB", label: "Sea Glass" },
  { value: "#8ECAE6", label: "Lagoon" },
  { value: "#BDE0FE", label: "Powder Blue" },
  { value: "#A0C4FF", label: "Sky Blue" },
  { value: "#B8C0FF", label: "Periwinkle" },
  { value: "#CDB4DB", label: "Lavender" },
  { value: "#D0BFFF", label: "Lilac" },
  { value: "#E0B1CB", label: "Mauve" },
  { value: "#F4C2C2", label: "Rose" },
  { value: "#FFCAD4", label: "Blush" },
  { value: "#FFB4A2", label: "Coral" },
  { value: "#FFD6A5", label: "Peach" },
  { value: "#FEC89A", label: "Apricot" },
  { value: "#FAEDCB", label: "Butter" },
  { value: "#EAD7C3", label: "Sand" },
  { value: "#DDBEA9", label: "Clay Rose" },
  { value: "#CCD5AE", label: "Sage" },
  { value: "#DDE5B6", label: "Pistachio" },
  { value: "#CDEAC0", label: "Mint" },
  { value: "#B8F2E6", label: "Aqua Mist" },
] as const;

export const DEFAULT_GOAL_COLOR = GOAL_COLOR_OPTIONS[0].value;

export const GOAL_COLOR_VALUES = GOAL_COLOR_OPTIONS.map((option) => option.value);
