import { createProposal, deleteProposal, listProposals, voteProposal, updateProposalStatus } from "./proposal.repository";
import { ensureAdmin } from "../../utils/validation";
import { assertValidObjectId } from "../../utils/object-id";

type Context = {
  userId: string | null;
  userRole: "user" | "admin";
  tokenVersion: number;
  clientIp: string;
};

export const proposalResolvers = {
  proposals: async (_args: unknown, context: Context) => {
    const all = await listProposals();
    return all.map((p) => ({
      id: p.id,
      category: p.category.toUpperCase(),
      title: p.title,
      description: p.description,
      status: p.status.toUpperCase(),
      votes: p.votes,
      hasVoted: p.voterIps.includes(context.clientIp),
      createdAt: p.createdAt,
    }));
  },
  createProposal: async (
    { category, title, description, contactEmail }: { category: string; title: string; description: string; contactEmail?: string },
    context: Context
  ) => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) throw new Error("Title is required");
    if (trimmedTitle.length > 200) throw new Error("Title must be at most 200 characters");
    if (!trimmedDescription) throw new Error("Description is required");
    if (trimmedDescription.length > 2000) throw new Error("Description must be at most 2000 characters");

    if (contactEmail) {
      const email = contactEmail.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email address");
      }
    }

    const categoryMap: Record<string, "bug" | "feature" | "text_change" | "other"> = {
      BUG: "bug",
      FEATURE: "feature",
      TEXT_CHANGE: "text_change",
      OTHER: "other",
    };

    const mappedCategory = categoryMap[category];
    if (!mappedCategory) throw new Error("Invalid category");

    const proposal = await createProposal({
      category: mappedCategory,
      title: trimmedTitle,
      description: trimmedDescription,
      contactEmail: contactEmail?.trim() || undefined,
      submitterIp: context.clientIp,
    });

    return {
      id: proposal.id,
      category: proposal.category.toUpperCase(),
      title: proposal.title,
      description: proposal.description,
      status: proposal.status.toUpperCase(),
      votes: proposal.votes,
      hasVoted: false,
      createdAt: proposal.createdAt,
    };
  },
  voteProposal: async ({ proposalId }: { proposalId: string }, context: Context) => {
    assertValidObjectId(proposalId, "proposal ID");
    const proposal = await voteProposal(proposalId, context.clientIp);
    if (!proposal) return null;

    return {
      id: proposal.id,
      category: proposal.category.toUpperCase(),
      title: proposal.title,
      description: proposal.description,
      status: proposal.status.toUpperCase(),
      votes: proposal.votes,
      hasVoted: true,
      createdAt: proposal.createdAt,
    };
  },
  deleteProposal: async ({ proposalId }: { proposalId: string }, context: Context) => {
    ensureAdmin(context);
    assertValidObjectId(proposalId, "proposal ID");
    const deleted = await deleteProposal(proposalId);
    if (!deleted) throw new Error("Proposal not found");
    return true;
  },
  updateProposalStatus: async ({ proposalId, status }: { proposalId: string; status: string }, context: Context) => {
    ensureAdmin(context);
    assertValidObjectId(proposalId, "proposal ID");

    const statusMap: Record<string, "open" | "in_review" | "done" | "rejected"> = {
      OPEN: "open",
      IN_REVIEW: "in_review",
      DONE: "done",
      REJECTED: "rejected",
    };

    const mappedStatus = statusMap[status];
    if (!mappedStatus) throw new Error("Invalid status");

    const proposal = await updateProposalStatus(proposalId, mappedStatus);
    if (!proposal) throw new Error("Proposal not found");

    return {
      id: proposal.id,
      category: proposal.category.toUpperCase(),
      title: proposal.title,
      description: proposal.description,
      status: proposal.status.toUpperCase(),
      votes: proposal.votes,
      hasVoted: proposal.voterIps.includes(context.clientIp),
      createdAt: proposal.createdAt,
    };
  },
};
