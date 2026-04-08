"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Button, Card, Group, Stack, Table, Text, Title } from "@mantine/core";
import { IconInfoCircle, IconRefresh } from "@tabler/icons-react";
import { CurrencySelect } from "@/shared/components/CurrencySelect";
import { GET_ME, type MeQueryData } from "@/shared/gql/queries";
import { GET_EXCHANGE_RATES, SET_PRIMARY_CURRENCY } from "@/features/profile/gql/currency";
import { getCurrencySymbol, SUPPORTED_CURRENCIES } from "@/shared/constants/currencies";
import { showToast } from "@/shared/lib/toast-store";
import { formatDay } from "@/shared/utils/date";

export const CurrencyCard = () => {
  const { data: meData } = useQuery<MeQueryData>(GET_ME);
  const primaryCurrency = meData?.me?.primaryCurrency ?? "USD";

  const { data: ratesData, loading: isLoadingRates, refetch: refetchRates } = useQuery<{
    exchangeRates: { base: string; rates: string; fetchedAt: string };
  }>(GET_EXCHANGE_RATES, { variables: { base: primaryCurrency } });

  const [setPrimaryCurrency, { loading: isSaving }] = useMutation(SET_PRIMARY_CURRENCY);

  const rates = useMemo<Record<string, number>>(() => {
    if (!ratesData?.exchangeRates?.rates) return {};
    try { return JSON.parse(ratesData.exchangeRates.rates); } catch { return {}; }
  }, [ratesData]);

  const handleCurrencyChange = async (currency: string) => {
    try {
      await setPrimaryCurrency({
        variables: { currency },
        refetchQueries: [{ query: GET_ME }, { query: GET_EXCHANGE_RATES, variables: { base: currency } }],
      });
      showToast(`Primary currency changed to ${currency}`, "teal");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update currency", "red");
    }
  };

  const handleRefreshRates = async () => {
    try {
      await refetchRates();
      showToast("Exchange rates refreshed", "teal");
    } catch {
      showToast("Failed to refresh rates", "red");
    }
  };

  const topCurrencies = SUPPORTED_CURRENCIES.filter((c) => c.code !== primaryCurrency && rates[c.code] != null).slice(0, 10);

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={4}>Currency</Title>
            <Text c="dimmed" size="sm">Set your primary currency for dashboard totals.</Text>
          </div>
        </Group>
        <CurrencySelect
          label="Primary currency"
          value={primaryCurrency}
          onChange={handleCurrencyChange}
          disabled={isSaving}
        />
        <Alert variant="light" color="blue" icon={<IconInfoCircle size={18} />}>
          <Text size="sm">
            Exchange rates are sourced from the European Central Bank (ECB) and cached for 24 hours.
            Rates are updated automatically once per day on first request.
          </Text>
        </Alert>
        {topCurrencies.length > 0 && (
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Text size="sm" fw={500}>Exchange rates</Text>
              <Button
                variant="subtle"
                size="compact-sm"
                leftSection={<IconRefresh size={14} />}
                onClick={handleRefreshRates}
                loading={isLoadingRates}
              >
                Refresh
              </Button>
            </Group>
            <Table striped highlightOnHover aria-label="Exchange rates">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Currency</Table.Th>
                  <Table.Th ta="right">{`1 ${primaryCurrency} =`}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {topCurrencies.map((c) => (
                  <Table.Tr key={c.code}>
                    <Table.Td>{c.code} ({getCurrencySymbol(c.code)})</Table.Td>
                    <Table.Td ta="right">{rates[c.code]?.toFixed(4)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {ratesData?.exchangeRates?.fetchedAt && (
              <Text size="xs" c="dimmed">
                Rates updated {formatDay(ratesData.exchangeRates.fetchedAt.slice(0, 10))} via ECB. Next update available after 24 hours.
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};
