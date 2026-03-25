import { gql } from "@apollo/client";

export const GET_PROPOSALS = gql`
  query Proposals {
    proposals {
      id
      category
      title
      description
      status
      votes
      hasVoted
      createdAt
    }
  }
`;

export const CREATE_PROPOSAL = gql`
  mutation CreateProposal($category: ProposalCategory!, $title: String!, $description: String!, $contactEmail: String) {
    createProposal(category: $category, title: $title, description: $description, contactEmail: $contactEmail) {
      id
      category
      title
      description
      status
      votes
      hasVoted
      createdAt
    }
  }
`;

export const VOTE_PROPOSAL = gql`
  mutation VoteProposal($proposalId: ID!) {
    voteProposal(proposalId: $proposalId) {
      id
      votes
      hasVoted
    }
  }
`;
