import { Schema, model } from "mongoose";

export type ProposalDocument = {
  category: "bug" | "feature" | "text_change" | "other";
  title: string;
  description: string;
  status: "open" | "in_review" | "done" | "rejected";
  contactEmail?: string;
  votes: number;
  voterIps: string[];
  submitterIp: string;
};

const proposalSchema = new Schema<ProposalDocument>(
  {
    category: {
      type: String,
      required: true,
      enum: ["bug", "feature", "text_change", "other"],
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: "open",
      enum: ["open", "in_review", "done", "rejected"],
      index: true,
    },
    contactEmail: { type: String },
    votes: { type: Number, required: true, default: 0 },
    voterIps: { type: [String], required: true, default: [] },
    submitterIp: { type: String, required: true },
  },
  { timestamps: true }
);

export const ProposalModel = model<ProposalDocument>("Proposal", proposalSchema);
