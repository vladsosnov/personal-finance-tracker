import { Container } from "@mantine/core";
import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
};

export const PageContainer = ({ children }: PageContainerProps) => (
  <Container size="xl" py={24}>
    {children}
  </Container>
);
