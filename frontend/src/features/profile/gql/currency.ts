import { gql } from "@apollo/client";

export const SET_PRIMARY_CURRENCY = gql`
  mutation SetPrimaryCurrency($currency: String!) {
    setPrimaryCurrency(currency: $currency) {
      id
      email
      subscription
      role
      primaryCurrency
      emailVerified
    }
  }
`;

export const GET_EXCHANGE_RATES = gql`
  query ExchangeRates($base: String!) {
    exchangeRates(base: $base) {
      base
      rates
      fetchedAt
    }
  }
`;

export const GET_SUPPORTED_CURRENCIES = gql`
  query SupportedCurrencies {
    supportedCurrencies {
      code
      symbol
      name
    }
  }
`;
