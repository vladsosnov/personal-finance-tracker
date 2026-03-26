"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { IconPlus } from "@tabler/icons-react";
import { Button, Card, Group, SegmentedControl, Select, Skeleton, Stack, Text, Title } from "@mantine/core";
import { PageContainer } from "@/shared/components/page-container";
import { StateMessage } from "@/shared/components/state-message";
import { CreateProposalModal } from "@/features/feedback/components/CreateProposalModal";
import { ProposalsTable } from "@/features/feedback/components/ProposalsTable";
import { useProposals } from "@/features/feedback/hooks/useProposals";
import { CATEGORY_LABELS, STATUS_LABELS, type ProposalCategory, type ProposalStatus } from "@/features/feedback/types";
import { GET_ME } from "@/shared/gql/queries";
import anim from "@/shared/styles/page-animations.module.css";

type SortOption = "newest" | "most_voted";
type FilterCategory = "all" | ProposalCategory;
type FilterStatus = "all" | ProposalStatus;

const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export const FeedbackClient = () => {
  const { proposals, isLoading, error, isCreating, createProposal, voteForProposal, updateProposalStatus, refetch } = useProposals();
  const { data: meData } = useQuery<{ me: { id: string; email: string; role: string } | null }>(GET_ME);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const isAdmin = meData?.me?.role === "admin";

  const filteredAndSorted = useMemo(() => {
    let result = [...proposals];

    if (filterCategory !== "all") {
      result = result.filter((p) => p.category === filterCategory);
    }

    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }

    if (sortBy === "most_voted") {
      result.sort((a, b) => b.votes - a.votes || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [proposals, filterCategory, filterStatus, sortBy]);

  const handleSubmit = async (input: { category: ProposalCategory; title: string; description: string; contactEmail?: string }) => {
    await createProposal(input);
    setIsModalOpen(false);
  };

  return (
    <PageContainer>
      <Stack gap="lg" className={anim.pageEnter}>
        <Stack gap={2}>
          <Title order={1}>Feedback</Title>
          <Text c="dimmed">Report bugs, suggest features, or request text changes. Vote on proposals you care about.</Text>
          <div className={anim.gradientDivider} style={{ marginTop: 4, marginLeft: 0 }} />
        </Stack>

        <div className={anim.stagger1}>
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Group gap="sm" align="flex-end" wrap="wrap">
              <Select
                label="Category"
                data={CATEGORY_FILTER_OPTIONS}
                value={filterCategory}
                onChange={(value) => setFilterCategory((value ?? "all") as FilterCategory)}
                allowDeselect={false}
                size="sm"
                style={{ width: 160 }}
                aria-label="Filter by category"
              />
              <Select
                label="Status"
                data={STATUS_FILTER_OPTIONS}
                value={filterStatus}
                onChange={(value) => setFilterStatus((value ?? "all") as FilterStatus)}
                allowDeselect={false}
                size="sm"
                style={{ width: 160 }}
                aria-label="Filter by status"
              />
              <SegmentedControl
                value={sortBy}
                onChange={(value) => setSortBy(value as SortOption)}
                data={[
                  { label: "Newest", value: "newest" },
                  { label: "Most voted", value: "most_voted" },
                ]}
                size="sm"
                aria-label="Sort proposals"
              />
            </Group>
            <Button leftSection={<IconPlus size={16} stroke={2} />} onClick={() => setIsModalOpen(true)}>
              Submit feedback
            </Button>
          </Group>
        </div>

        <div className={anim.stagger2}>
          {isLoading && !proposals.length ? (
            <Card withBorder radius="md" p="lg">
              <div role="status" aria-label="Loading proposals">
                <span className="sr-only">Loading proposals...</span>
                <Stack gap="sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} height={44} radius="md" />
                  ))}
                </Stack>
              </div>
            </Card>
          ) : error && !proposals.length ? (
            <Card withBorder radius="md" p="xl">
              <StateMessage
                title="Couldn't load proposals"
                description={error.message}
                actionLabel="Try again"
                onAction={() => refetch()}
              />
            </Card>
          ) : (
            <ProposalsTable
              proposals={filteredAndSorted}
              onVote={voteForProposal}
              onUpdateStatus={isAdmin ? updateProposalStatus : undefined}
            />
          )}
        </div>

        <CreateProposalModal
          opened={isModalOpen}
          isLoading={isCreating}
          onSubmit={handleSubmit}
          onClose={() => setIsModalOpen(false)}
        />
      </Stack>
    </PageContainer>
  );
};
