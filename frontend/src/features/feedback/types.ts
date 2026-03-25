export type ProposalCategory = "BUG" | "FEATURE" | "TEXT_CHANGE" | "OTHER";
export type ProposalStatus = "OPEN" | "IN_REVIEW" | "DONE" | "REJECTED";

export type Proposal = {
  id: string;
  category: ProposalCategory;
  title: string;
  description: string;
  status: ProposalStatus;
  votes: number;
  hasVoted: boolean;
  createdAt: string;
};

export const CATEGORY_LABELS: Record<ProposalCategory, string> = {
  BUG: "Bug",
  FEATURE: "Feature",
  TEXT_CHANGE: "Text change",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  OPEN: "Open",
  IN_REVIEW: "In review",
  DONE: "Done",
  REJECTED: "Rejected",
};

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  OPEN: "blue",
  IN_REVIEW: "orange",
  DONE: "teal",
  REJECTED: "gray",
};

export const CATEGORY_COLORS: Record<ProposalCategory, string> = {
  BUG: "red",
  FEATURE: "violet",
  TEXT_CHANGE: "cyan",
  OTHER: "gray",
};
