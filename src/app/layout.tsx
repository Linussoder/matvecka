import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShoppingListProvider } from "@/contexts/ShoppingListContext";
import FloatingCart from "@/components/FloatingCart";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ShoppingListProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
          <FloatingCart />
        </ShoppingListProvider>
      </body>
    </html>
  );
}
