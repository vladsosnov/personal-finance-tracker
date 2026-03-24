import { Card, SimpleGrid, Skeleton, Stack } from "@mantine/core";
import { PageContainer } from "@/shared/components/page-container";

export const DashboardSkeleton = () => {
  return (
    <PageContainer>
      <Stack gap="lg">
        <Stack gap="xs">
          <Skeleton height={34} width="40%" />
          <Skeleton height={18} width="24%" />
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 3 }}>
          <Card withBorder radius="md" p="lg">
            <Stack gap="sm">
              <Skeleton height={16} width="45%" />
              <Skeleton height={28} width="70%" />
            </Stack>
          </Card>
          <Card withBorder radius="md" p="lg">
            <Stack gap="sm">
              <Skeleton height={16} width="45%" />
              <Skeleton height={28} width="70%" />
            </Stack>
          </Card>
          <Card withBorder radius="md" p="lg">
            <Stack gap="sm">
              <Skeleton height={16} width="45%" />
              <Skeleton height={28} width="70%" />
            </Stack>
          </Card>
        </SimpleGrid>

        <Card withBorder radius="md" p="lg">
          <Stack gap="sm">
            <Skeleton height={24} width="30%" />
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Stack>
        </Card>
      </Stack>
    </PageContainer>
  );
};
