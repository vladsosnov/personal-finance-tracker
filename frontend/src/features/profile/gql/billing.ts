import { gql } from "@apollo/client";

export const CREATE_BILLING_CHECKOUT = gql`
  mutation CreateBillingCheckout($plan: BillingPlan!) {
    createBillingCheckout(plan: $plan) {
      url
    }
  }
`;

export const CREATE_BILLING_PORTAL_SESSION = gql`
  mutation CreateBillingPortalSession {
    createBillingPortalSession {
      url
    }
  }
`;
