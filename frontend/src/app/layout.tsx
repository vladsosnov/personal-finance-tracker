import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ColorSchemeScript } from "@mantine/core";
import { Footer } from "@/shared/components/footer";
import { AppThemeProvider } from "@/shared/components/app-theme-provider";
import { Header } from "@/shared/components/header";
import { Providers } from "@/shared/components/providers";
import { RegisterSW } from "@/shared/components/register-sw";
import "./globals.css";
import "@mantine/core/styles.css";

const inter = Inter({ subsets: ["latin"] });

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SITE_URL = `https://vladsosnov.github.io${BASE_PATH}`;
const OG_IMAGE = `${SITE_URL}/icons/icon-512x512.png`;

export const metadata: Metadata = {
  title: "Financial Goals Tracker",
  description: "Set financial goals, track your progress, and stay motivated with visual charts and history.",
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinTracker",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "Financial Goals Tracker",
    description: "Set financial goals, track your progress, and stay motivated with visual charts and history.",
    url: SITE_URL,
    siteName: "Financial Goals Tracker",
    images: [{ url: OG_IMAGE, width: 512, height: 512, alt: "Financial Goals Tracker" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Financial Goals Tracker",
    description: "Set financial goals, track your progress, and stay motivated with visual charts and history.",
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#316263",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
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
              <RegisterSW />
            </div>
          </Providers>
        </AppThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
