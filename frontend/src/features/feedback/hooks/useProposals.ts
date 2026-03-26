import { useMutation, useQuery } from "@apollo/client/react";
import { CREATE_PROPOSAL, GET_PROPOSALS, VOTE_PROPOSAL, UPDATE_PROPOSAL_STATUS } from "@/features/feedback/gql/feedback";
import type { Proposal, ProposalCategory, ProposalStatus } from "@/features/feedback/types";

type ProposalsQueryData = {
  proposals: Proposal[];
};

type CreateProposalData = {
  createProposal: Proposal;
};

type VoteProposalData = {
  voteProposal: Proposal | null;
};

type UpdateProposalStatusData = {
  updateProposalStatus: Proposal;
};

export const useProposals = () => {
  const { data, loading, error, refetch } = useQuery<ProposalsQueryData>(GET_PROPOSALS, {
    fetchPolicy: "cache-and-network",
  });

  const [createProposalMutation, { loading: isCreating }] = useMutation<CreateProposalData>(CREATE_PROPOSAL);
  const [voteProposalMutation] = useMutation<VoteProposalData>(VOTE_PROPOSAL);
  const [updateStatusMutation] = useMutation<UpdateProposalStatusData>(UPDATE_PROPOSAL_STATUS);

  const proposals = data?.proposals ?? [];

  const createProposal = async (input: {
    category: ProposalCategory;
    title: string;
    description: string;
    contactEmail?: string;
  }) => {
    await createProposalMutation({
      variables: input,
    });
    await refetch();
  };

  const voteForProposal = async (proposalId: string) => {
    await voteProposalMutation({
      variables: { proposalId },
    });
    await refetch();
  };

  const updateProposalStatus = async (proposalId: string, status: ProposalStatus) => {
    await updateStatusMutation({
      variables: { proposalId, status },
    });
    await refetch();
  };

  return {
    proposals,
    isLoading: loading,
    error,
    isCreating,
    createProposal,
    voteForProposal,
    updateProposalStatus,
    refetch,
  };
};
