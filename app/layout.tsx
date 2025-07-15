import type { Metadata } from "next";
import { Geist, Geist_Mono, Exo_2, Rajdhani } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Squid Market - Exclusive NFT Marketplace",
  description:
    "Join the exclusive marketplace experience for Squid Market.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`bg-black ${geistSans.variable} ${geistMono.variable} ${exo2.variable} ${rajdhani.variable} antialiased`}
        suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
