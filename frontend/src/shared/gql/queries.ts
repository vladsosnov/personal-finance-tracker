import { gql } from "@apollo/client";

export type MeUser = {
  id: string;
  email: string;
  subscription: string;
  role: string;
  primaryCurrency: string;
  emailVerified: boolean;
};

export type MeQueryData = { me: MeUser | null };

export const GET_ME = gql`
  query Me {
    me {
      id
      email
      subscription
      role
      primaryCurrency
      emailVerified
    }
  }
`;
