import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AidLearn Analytics | Corporate Assessment Platform",
  description: "Enterprise technical skills assessments and diagnostic capability evaluation by AidLearn Analytics.",
  icons: {
    icon: [
      { url: "/brand/aidlearn-symbol-transparent.png", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/brand/aidlearn-symbol-transparent.png",
    apple: "/brand/aidlearn-symbol-transparent.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/brand/aidlearn-symbol-transparent.png" type="image/png" />
        <link rel="apple-touch-icon" href="/brand/aidlearn-symbol-transparent.png" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
