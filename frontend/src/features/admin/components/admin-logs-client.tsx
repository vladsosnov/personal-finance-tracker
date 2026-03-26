"use client";

import { useQuery } from "@apollo/client/react";
import { ActionIcon, Badge, Card, Grid, Group, Loader, Pagination, Select, Stack, Table, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/shared/components/page-container";
import { StateMessage } from "@/shared/components/state-message";
import { GET_ME } from "@/shared/gql/queries";
import { APP_ROUTES } from "@/shared/constants/routes";
import { GET_ANALYTICS_STATS } from "@/features/admin/gql/admin";

type EventCount = {
  event: string;
  count: number;
};

type RecentEvent = {
  id: string;
  event: string;
  userId: string | null;
  createdAt: string;
};

type AnalyticsStats = {
  eventCounts: EventCount[];
  uniqueUserLogins: number;
  recentEvents: RecentEvent[];
};

const EVENT_LABELS: Record<string, string> = {
  login_click: "Login Button Clicks",
  register_click: "Register Button Clicks",
  login_success: "Successful Logins",
  register_success: "Successful Registrations",
  forgot_password_click: "Forgot Password Clicks",
  reset_password_submit: "Reset Password Submits",
  add_goal_click: "Add Goal Clicks",
  goal_deleted: "Goals Deleted",
  operation_added: "Operations Added",
  operation_deleted: "Operations Deleted",
  profile_page_view: "Profile Page Views",
  data_exported: "Data Exports",
  data_imported: "Data Imports",
  data_reset: "Data Resets",
  delete_account_click: "Delete Account Clicks",
};

const formatEventName = (event: string) => EVENT_LABELS[event] ?? event;

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Card withBorder radius="md" p="md">
    <Text size="sm" c="dimmed">{label}</Text>
    <Title order={3} mt={4}>{value.toLocaleString()}</Title>
  </Card>
);

const PAGE_SIZE = 50;

const RecentEventsTable = ({ events }: { events: RecentEvent[] }) => {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const eventOptions = useMemo(() => {
    const unique = Array.from(new Set(events.map((e) => e.event))).sort();
    return unique.map((e) => ({ value: e, label: formatEventName(e) }));
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (eventFilter && event.event !== eventFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesEvent = event.event.toLowerCase().includes(q);
        const matchesUser = (event.userId ?? "anonymous").toLowerCase().includes(q);
        if (!matchesEvent && !matchesUser) return false;
      }
      return true;
    });
  }, [events, eventFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, eventFilter]);

  return (
    <Stack gap="sm">
      <Group>
        <TextInput
          placeholder="Search by event or user ID..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="All events"
          data={eventOptions}
          value={eventFilter}
          onChange={setEventFilter}
          clearable
          w={220}
        />
      </Group>
      <Card withBorder radius="md" p={0}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Event</Table.Th>
              <Table.Th>User ID</Table.Th>
              <Table.Th>Time</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paged.map((event) => (
              <Table.Tr key={event.id}>
                <Table.Td>
                  <Badge variant="light" size="sm">{event.event}</Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" style={{ fontFamily: "monospace" }}>
                    {event.userId ?? "anonymous"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {new Date(event.createdAt).toLocaleString()}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
            {!filtered.length && (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text c="dimmed" ta="center" py="md">
                    {events.length ? "No events match your filters" : "No events yet"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          {filtered.length > 0
            ? `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} events`
            : `${events.length} total events`}
        </Text>
        {totalPages > 1 && (
          <Pagination total={totalPages} value={safePage} onChange={setPage} size="sm" />
        )}
      </Group>
    </Stack>
  );
};

export const AdminLogsClient = () => {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useQuery<{
    me: { id: string; role: string } | null;
  }>(GET_ME);

  const isAdmin = meData?.me?.role === "admin";

  const { data, loading, error, refetch } = useQuery<{ analyticsStats: AnalyticsStats }>(
    GET_ANALYTICS_STATS,
    { skip: !isAdmin }
  );

  useEffect(() => {
    if (meLoading) return;
    if (!meData?.me) {
      router.replace(APP_ROUTES.auth);
    } else if (meData.me.role !== "admin") {
      router.replace(APP_ROUTES.dashboard);
    }
  }, [meLoading, meData, router]);

  if (meLoading) {
    return (
      <PageContainer>
        <Stack align="center" py="xl">
          <Loader />
        </Stack>
      </PageContainer>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const stats = data?.analyticsStats;
  const getCount = (event: string) =>
    stats?.eventCounts.find((e) => e.event === event)?.count ?? 0;

  return (
    <PageContainer>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>Analytics Logs</Title>
          <Group gap="sm">
            <Tooltip label="Refresh data">
              <ActionIcon variant="subtle" size="lg" onClick={() => refetch()} loading={loading}>
                <Text size="lg">&#x21bb;</Text>
              </ActionIcon>
            </Tooltip>
            <Badge color="red" variant="filled" size="lg">Admin</Badge>
          </Group>
        </Group>

        {loading && !stats && (
          <Stack align="center" py="xl">
            <Loader />
          </Stack>
        )}

        {error && !stats && (
          <Card withBorder radius="md" p="xl">
            <StateMessage
              title="Failed to load analytics"
              description={error.message}
              actionLabel="Try again"
              onAction={() => refetch()}
            />
          </Card>
        )}

        {stats && (
          <>
            <Grid>
              <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
                <StatCard label="Unique Users Logged In" value={stats.uniqueUserLogins} />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
                <StatCard label="Successful Logins" value={getCount("login_success")} />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
                <StatCard label="Successful Registrations" value={getCount("register_success")} />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
                <StatCard label="Login Button Clicks" value={getCount("login_click")} />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
                <StatCard label="Register Button Clicks" value={getCount("register_click")} />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
                <StatCard label="Add Goal Clicks" value={getCount("add_goal_click")} />
              </Grid.Col>
            </Grid>

            <Title order={3}>All Event Counts</Title>
            <Card withBorder radius="md" p={0}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Event</Table.Th>
                    <Table.Th style={{ textAlign: "right" }}>Count</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {stats.eventCounts.map((ec) => (
                    <Table.Tr key={ec.event}>
                      <Table.Td>{formatEventName(ec.event)}</Table.Td>
                      <Table.Td style={{ textAlign: "right" }}>{ec.count.toLocaleString()}</Table.Td>
                    </Table.Tr>
                  ))}
                  {!stats.eventCounts.length && (
                    <Table.Tr>
                      <Table.Td colSpan={2}>
                        <Text c="dimmed" ta="center" py="md">No events recorded yet</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Card>

            <Title order={3}>Recent Events</Title>
            <RecentEventsTable events={stats.recentEvents} />
          </>
        )}
      </Stack>
    </PageContainer>
  );
};
