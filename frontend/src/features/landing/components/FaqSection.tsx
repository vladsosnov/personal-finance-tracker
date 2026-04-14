"use client";

import { Accordion, Stack, Text, Title } from "@mantine/core";
import { AnimateOnScroll } from "@/features/landing/components/AnimateOnScroll";

const FAQ_ITEMS = [
  {
    question: "Is it really free?",
    answer:
      "Yes. The core product - goal tracking, operations, charts, multi-currency, import/export - is free with no limits. Paid plans will add convenience features later, but free stays free.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "Your data is stored securely in a cloud database. You can export everything as a .txt backup at any time from the Profile page, and you can delete your account and all associated data whenever you want.",
  },
  {
    question: "Can I track goals in different currencies?",
    answer:
      "Yes. Each goal has its own currency, and you can add operations in any supported currency. Exchange rates are fetched automatically and updated daily from the European Central Bank.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Yes. The app is fully responsive and installable as a PWA on iOS, Android, and desktop. Just tap \"Install App\" in the header.",
  },
  {
    question: "Can I import my existing savings history?",
    answer:
      "Yes. Go to Profile and use the Import feature to upload a .txt file with your goals and operations. You can preview and remove individual items before importing.",
  },
];

export const FaqSection = () => (
  <section aria-labelledby="faq-heading">
    <AnimateOnScroll>
      <Stack gap="md" maw={760} mx="auto">
        <Stack gap={4} ta="center">
          <Text fw={700}>FAQ</Text>
          <Title order={2} id="faq-heading">Common questions</Title>
        </Stack>
        <Accordion variant="separated" radius="md">
          {FAQ_ITEMS.map((item) => (
            <Accordion.Item key={item.question} value={item.question}>
              <Accordion.Control>{item.question}</Accordion.Control>
              <Accordion.Panel>
                <Text c="dimmed">{item.answer}</Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    </AnimateOnScroll>
  </section>
);
