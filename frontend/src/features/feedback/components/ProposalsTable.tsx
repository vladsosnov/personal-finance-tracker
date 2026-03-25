import { useMemo, useState } from "react";
import { IconArrowUp } from "@tabler/icons-react";
import { ActionIcon, Badge, Card, Group, Pagination, Stack, Table, Text, Tooltip } from "@mantine/core";
import type { Proposal, ProposalCategory, ProposalStatus } from "@/features/feedback/types";
import { CATEGORY_COLORS, CATEGORY_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/features/feedback/types";

const ITEMS_PER_PAGE = 10;

type ProposalsTableProps = {
  proposals: Proposal[];
  onVote: (proposalId: string) => void;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const ProposalsTable = ({ proposals, onVote }: ProposalsTableProps) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(proposals.length / ITEMS_PER_PAGE));

  const paginatedProposals = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return proposals.slice(start, start + ITEMS_PER_PAGE);
  }, [page, proposals]);

  if (!proposals.length) {
    return (
      <Card withBorder radius="md" p="xl">
        <Stack align="center" gap="xs">
          <Text fw={500}>No feedback yet</Text>
          <Text c="dimmed">Be the first to submit a suggestion or report a bug.</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="sm">
      <Table striped highlightOnHover aria-label="Feedback proposals">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 60 }}>Votes</Table.Th>
            <Table.Th style={{ width: 110 }}>Category</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th style={{ width: 100 }}>Status</Table.Th>
            <Table.Th style={{ width: 120 }}>Date</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginatedProposals.map((proposal) => (
            <Table.Tr key={proposal.id}>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <Tooltip label={proposal.hasVoted ? "Already voted" : "Vote for this"}>
                    <ActionIcon
                      variant={proposal.hasVoted ? "light" : "subtle"}
                      color={proposal.hasVoted ? "blue" : "gray"}
                      size="sm"
                      aria-label={`Vote for "${proposal.title}"${proposal.hasVoted ? " (already voted)" : ""}`}
                      disabled={proposal.hasVoted}
                      onClick={() => onVote(proposal.id)}
                    >
                      <IconArrowUp size={14} stroke={2} />
                    </ActionIcon>
                  </Tooltip>
                  <Text size="sm" fw={500}>{proposal.votes}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge
                  color={CATEGORY_COLORS[proposal.category as ProposalCategory]}
                  variant="light"
                  size="sm"
                >
                  {CATEGORY_LABELS[proposal.category as ProposalCategory] ?? proposal.category}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Tooltip label={proposal.description} multiline maw={400} withArrow>
                  <Text
                    size="sm"
                    fw={500}
                    style={{
                      maxWidth: 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {proposal.title}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>
                <Badge
                  color={STATUS_COLORS[proposal.status as ProposalStatus]}
                  variant="light"
                  size="sm"
                >
                  {STATUS_LABELS[proposal.status as ProposalStatus] ?? proposal.status}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">{formatDate(proposal.createdAt)}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {proposals.length > ITEMS_PER_PAGE && (
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(page * ITEMS_PER_PAGE, proposals.length)} of {proposals.length}
          </Text>
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      )}
    </Stack>
  );
};
