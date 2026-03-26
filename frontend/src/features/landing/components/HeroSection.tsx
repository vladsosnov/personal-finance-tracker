import { Badge, Stack, Text, Title } from "@mantine/core";
import { SignInCta } from "@/features/auth/components/sign-in-cta";
import styles from "@/features/landing/styles/landing.module.css";

export const HeroSection = () => (
  <section aria-labelledby="hero-heading" className={styles.heroWrapper}>
    <div className={styles.orbContainer}>
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />
    </div>

    <div className={styles.heroContent}>
      <Stack gap="md" ta="center" maw={820} mx="auto">
        <div className={styles.heroStagger1}>
          <Badge variant="light" size="lg" mx="auto">
            Financial Goals Tracker
          </Badge>
        </div>

        <div className={styles.heroStagger2}>
          <Title order={1} id="hero-heading" className={styles.gradientTitle} fz={{ base: 32, sm: 44, md: 52 }}>
            Turn savings goals into a system you can actually follow
          </Title>
        </div>

        <div className={styles.heroStagger3}>
          <Text c="dimmed" maw={720} mx="auto" fz={{ base: "md", md: "lg" }}>
            Create goals, log real operations, review progress over time, import existing history, and move completed
            goals out of the way without losing the record.
          </Text>
        </div>

        <div className={styles.heroStagger4}>
          <SignInCta />
        </div>
      </Stack>
    </div>
  </section>
);
