import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ColorSchemeScript } from "@mantine/core";
import { Footer } from "@/shared/components/footer";
import { AppThemeProvider } from "@/shared/components/app-theme-provider";
import { Header } from "@/shared/components/header";
import { Providers } from "@/shared/components/providers";
import "./globals.css";
import "@mantine/core/styles.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Financial Goals Tracker",
  description: "Track progress toward your financial goals",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body className={inter.className}>
        <AppThemeProvider>
          <Providers>
            <div className="app-shell">
              <a href="#main-content" className="skip-to-content">
                Skip to main content
              </a>
              <Header />
              <main id="main-content" className="app-main">{children}</main>
              <Footer />
            </div>
          </Providers>
        </AppThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
