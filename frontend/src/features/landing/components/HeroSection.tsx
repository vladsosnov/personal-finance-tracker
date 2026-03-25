import { Badge, Stack, Text, Title } from "@mantine/core";
import { SignInCta } from "@/features/auth/components/sign-in-cta";

export const HeroSection = () => (
  <section aria-labelledby="hero-heading">
    <Stack gap="xs" ta="center" maw={820} mx="auto">
      <Badge variant="light" size="lg" mx="auto">
        Financial Goals Tracker
      </Badge>
      <Title order={1} id="hero-heading">Turn savings goals into a system you can actually follow</Title>
      <Text c="dimmed" maw={720} mx="auto">
        Create goals, log real operations, review progress over time, import existing history, and move completed goals out of the way
        without losing the record.
      </Text>
      <SignInCta />
    </Stack>
  </section>
);
