import { Card, Stack, Text, Title } from "@mantine/core";
import { SignInCta } from "@/features/auth/components/sign-in-cta";

export const CtaSection = () => (
  <section aria-labelledby="cta-heading">
    <Card withBorder radius="lg" p="xl">
      <Stack gap="sm" ta="center" maw={720} mx="auto">
        <Title order={2} id="cta-heading">Start tracking with Financial Goals Tracker</Title>
        <Text c="dimmed">
          If you are already signed in, go straight back to your dashboard. If not, create an account and start with your first goal.
        </Text>
        <SignInCta />
      </Stack>
    </Card>
  </section>
);
