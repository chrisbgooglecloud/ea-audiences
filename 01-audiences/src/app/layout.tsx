import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EA Live Service | Audience Intelligence Engine",
  description: "Unified Player Graph, Situational Triggers, and DeepSona Synthetic Multi-Agent Testing powered by Google Cloud Spanner Graph and Vertex AI.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
