"use client";

import { MantineProvider, createTheme, localStorageColorSchemeManager } from "@mantine/core";
import { APP_THEME_KEY } from "@/shared/constants/storage";

type AppThemeProviderProps = {
  children: React.ReactNode;
};

const colorSchemeManager = localStorageColorSchemeManager({
  key: APP_THEME_KEY,
});

const theme = createTheme({
  primaryColor: "teal",
  colors: {
    teal: [
      "#edf5f5",
      "#d5e8e8",
      "#aed1d1",
      "#84b8b9",
      "#5a9fa0",
      "#438889",
      "#316263",
      "#2a5455",
      "#234647",
      "#1c3839",
    ],
  },
});

export const AppThemeProvider = ({ children }: AppThemeProviderProps) => {
  return (
    <MantineProvider theme={theme} colorSchemeManager={colorSchemeManager} defaultColorScheme="auto">
      {children}
    </MantineProvider>
  );
};
