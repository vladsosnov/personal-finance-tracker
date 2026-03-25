import { gql } from "@apollo/client";

export const GET_ANALYTICS_STATS = gql`
  query AnalyticsStats {
    analyticsStats {
      eventCounts {
        event
        count
      }
      uniqueUserLogins
      recentEvents {
        id
        event
        userId
        createdAt
      }
    }
  }
`;
