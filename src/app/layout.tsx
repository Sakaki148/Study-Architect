import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "AI Study Architect",
  description: "Transform your study materials into a complete AI-powered study system with structured notes, smart timelines, flashcards, and adaptive quizzes.",
  keywords: ["study", "AI", "notes", "flashcards", "quiz", "learning"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${dmSans.variable} ${dmMono.variable} font-sans antialiased bg-noise`}>
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
