import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShoppingListProvider } from "@/contexts/ShoppingListContext";
import { FavoritesProvider } from "@/lib/FavoritesContext";
import FloatingCart from "@/components/FloatingCart";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { ServiceWorkerProvider } from "@/hooks/useServiceWorker";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Matvecka - Smart matplanering",
  description: "Spara tid och pengar på veckohandlingen med smarta matplaner baserade på veckans bästa erbjudanden från ICA, Coop och City Gross.",
  keywords: "matplanering, veckomeny, recept, erbjudanden, spara pengar, inköpslista, ICA, Coop, City Gross, Sverige",
  authors: [{ name: "Matvecka" }],
  metadataBase: new URL("https://matvecka.se"),

  // PWA Meta Tags
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Matvecka",
  },
  formatDetection: {
    telephone: false,
  },

  openGraph: {
    title: "Matvecka - Smart matplanering",
    description: "Spara tid och pengar på veckohandlingen med smarta matplaner.",
    url: "https://matvecka.se",
    siteName: "Matvecka",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Matvecka - Smart matplanering",
    description: "Spara tid och pengar på veckohandlingen med smarta matplaner.",
  },
  robots: {
    index: true,
    follow: true,
  },

  // Icons for PWA
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon.svg" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <head>
        {/* PWA Additional Meta Tags */}
        <meta name="application-name" content="Matvecka" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Matvecka" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#16a34a" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ServiceWorkerProvider>
          <ShoppingListProvider>
            <FavoritesProvider>
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
              <FloatingCart />
              <PWAInstallPrompt />
            </FavoritesProvider>
          </ShoppingListProvider>
        </ServiceWorkerProvider>
        <Analytics />
      </body>
    </html>
  );
}
