import mongoose from "mongoose";
import { ProposalModel } from "../../db/models/proposal.model";

export type Proposal = {
  id: string;
  category: "bug" | "feature" | "text_change" | "other";
  title: string;
  description: string;
  status: "open" | "in_review" | "done" | "rejected";
  contactEmail?: string;
  votes: number;
  submitterIp: string;
  voterIps: string[];
  createdAt: string;
};

const toProposal = (doc: {
  _id: mongoose.Types.ObjectId;
  category: string;
  title: string;
  description: string;
  status: string;
  contactEmail?: string;
  votes: number;
  submitterIp: string;
  voterIps: string[];
  createdAt: Date;
}): Proposal => ({
  id: doc._id.toString(),
  category: doc.category as Proposal["category"],
  title: doc.title,
  description: doc.description,
  status: doc.status as Proposal["status"],
  contactEmail: doc.contactEmail,
  votes: doc.votes,
  submitterIp: doc.submitterIp,
  voterIps: doc.voterIps ?? [],
  createdAt: doc.createdAt.toISOString(),
});

type DocShape = {
  _id: mongoose.Types.ObjectId;
  category: string;
  title: string;
  description: string;
  status: string;
  contactEmail?: string;
  votes: number;
  submitterIp: string;
  voterIps: string[];
  createdAt: Date;
};

export const listProposals = async (): Promise<Proposal[]> => {
  const docs = await ProposalModel.find().sort({ createdAt: -1 }).lean();
  return docs.map((doc) => toProposal(doc as unknown as DocShape));
};

export const createProposal = async (input: {
  category: Proposal["category"];
  title: string;
  description: string;
  contactEmail?: string;
  submitterIp: string;
}): Promise<Proposal> => {
  const doc = await ProposalModel.create({
    category: input.category,
    title: input.title,
    description: input.description,
    contactEmail: input.contactEmail,
    submitterIp: input.submitterIp,
    status: "open",
    votes: 0,
    voterIps: [],
  });
  return toProposal(doc.toObject() as unknown as DocShape);
};

export const voteProposal = async (proposalId: string, voterIp: string): Promise<Proposal | null> => {
  const existing = await ProposalModel.findById(proposalId).lean();
  if (!existing) return null;

  const alreadyVoted = (existing.voterIps ?? []).includes(voterIp);
  if (alreadyVoted) return null;

  const doc = await ProposalModel.findByIdAndUpdate(
    proposalId,
    { $inc: { votes: 1 }, $push: { voterIps: voterIp } },
    { new: true }
  ).lean();

  return doc ? toProposal(doc as unknown as DocShape) : null;
};
