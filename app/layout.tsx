import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AidLearn Analytics",
  description: "Skills assessments for companies — built by AidLearn Analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
