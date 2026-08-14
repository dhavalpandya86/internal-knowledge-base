import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Internal Knowledge Base",
  description:
    "Self-hosted knowledge base: cluster support tickets, generate & approve KB articles, answer RFPs, ingest documents, and query your own AI provider.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
