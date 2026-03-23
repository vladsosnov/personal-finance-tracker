"use client";

import { MantineProvider, localStorageColorSchemeManager } from "@mantine/core";
import { APP_THEME_KEY } from "@/shared/constants/storage";

type AppThemeProviderProps = {
  children: React.ReactNode;
};

const colorSchemeManager = localStorageColorSchemeManager({
  key: APP_THEME_KEY,
});

export const AppThemeProvider = ({ children }: AppThemeProviderProps) => {
  return (
    <MantineProvider colorSchemeManager={colorSchemeManager} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
};
