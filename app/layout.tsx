import type { Metadata } from "next";
import "./globals.css";
import "./mobile-glass.css";
import "./theme.css";
import AppTheme from "./theme-provider";
import VisitTracker from "./visit-tracker";

export const metadata: Metadata = {
  title: "Pocket — yet another expense tracker, but better",
  description: "Your spending calendar, card rewards, and intentional purchases in one private space.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
      <body className="antialiased"><AppTheme>{children}<VisitTracker/></AppTheme></body>
    </html>
  );
}
