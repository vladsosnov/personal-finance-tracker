import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Footer } from "@/shared/components/footer";
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
        <MantineProvider defaultColorScheme="light">
          <Providers>
            <div className="app-shell">
              <Header />
              <main className="app-main">{children}</main>
              <Footer />
            </div>
          </Providers>
        </MantineProvider>
      </body>
    </html>
  );
};

export default RootLayout;
