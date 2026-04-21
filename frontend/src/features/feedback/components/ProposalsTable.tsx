import React, { useMemo, useState } from "react";
import { IconArrowUp, IconTrash } from "@tabler/icons-react";
import { ActionIcon, Badge, Card, Group, Pagination, Select, Stack, Table, Text, Tooltip } from "@mantine/core";
import type { Proposal, ProposalCategory, ProposalStatus } from "@/features/feedback/types";
import { CATEGORY_COLORS, CATEGORY_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/features/feedback/types";

const ITEMS_PER_PAGE = 10;

type ProposalsTableProps = {
  proposals: Proposal[];
  onVote: (proposalId: string) => void;
  onUpdateStatus?: (proposalId: string, status: ProposalStatus) => void;
  onDelete?: (proposalId: string) => void;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const ProposalsTable = ({ proposals, onVote, onUpdateStatus, onDelete }: ProposalsTableProps) => {
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [prevLength, setPrevLength] = useState(proposals.length);

  if (proposals.length !== prevLength) {
    setPrevLength(proposals.length);
    setPage(1);
  }

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
            <Table.Th visibleFrom="xs" style={{ width: 110 }}>Category</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th style={{ width: onUpdateStatus ? 140 : 100 }}>Status</Table.Th>
            <Table.Th visibleFrom="sm" style={{ width: 120 }}>Date</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginatedProposals.map((proposal) => (
            <React.Fragment key={proposal.id}>
              <Table.Tr
                style={{ cursor: "pointer" }}
                onClick={() => setExpandedRow(expandedRow === proposal.id ? null : proposal.id)}
              >
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <Tooltip label={proposal.hasVoted ? "Already voted" : "Vote for this"}>
                      <ActionIcon
                        variant={proposal.hasVoted ? "light" : "subtle"}
                        color={proposal.hasVoted ? "blue" : "gray"}
                        size="sm"
                        aria-label={`Vote for "${proposal.title}"${proposal.hasVoted ? " (already voted)" : ""}`}
                        disabled={proposal.hasVoted}
                        onClick={(e) => {
                          e.stopPropagation();
                          onVote(proposal.id);
                        }}
                      >
                        <IconArrowUp size={14} stroke={2} />
                      </ActionIcon>
                    </Tooltip>
                    <Text size="sm" fw={500}>{proposal.votes}</Text>
                  </Group>
                </Table.Td>
                <Table.Td visibleFrom="xs">
                  <Badge
                    color={CATEGORY_COLORS[proposal.category as ProposalCategory]}
                    variant="light"
                    size="sm"
                  >
                    {CATEGORY_LABELS[proposal.category as ProposalCategory] ?? proposal.category}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500} style={{ wordBreak: "break-word" }}>
                    {proposal.title}
                  </Text>
                </Table.Td>
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <Group gap={6} wrap="nowrap">
                    {onUpdateStatus ? (
                      <Select
                        size="xs"
                        data={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                        value={proposal.status}
                        onChange={(value) => value && onUpdateStatus(proposal.id, value as ProposalStatus)}
                        allowDeselect={false}
                        styles={{ input: { fontSize: "12px" } }}
                      />
                    ) : (
                      <Badge
                        color={STATUS_COLORS[proposal.status as ProposalStatus]}
                        variant="light"
                        size="sm"
                      >
                        {STATUS_LABELS[proposal.status as ProposalStatus] ?? proposal.status}
                      </Badge>
                    )}
                    {onDelete && (
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          aria-label={`Delete "${proposal.title}"`}
                          onClick={(e) => { e.stopPropagation(); onDelete(proposal.id); }}
                        >
                          <IconTrash size={14} stroke={2} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td visibleFrom="sm">
                  <Text size="sm" c="dimmed">{formatDate(proposal.createdAt)}</Text>
                </Table.Td>
              </Table.Tr>
              {expandedRow === proposal.id && (
                <Table.Tr>
                  <Table.Td colSpan={5} style={{ backgroundColor: "var(--mantine-color-gray-0)", padding: "12px 16px" }}>
                    <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                      {proposal.description}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </React.Fragment>
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
