import type { Metadata } from "next";
import "./globals.css";
import React from "react";

export const metadata: Metadata = {
  title: "Zylo — AI Study Architect",
  description: "Transform your study materials into mastery. Zylo generates structured notes, smart timelines, flashcards, and adaptive quizzes — all powered by AI.",
  keywords: ["study", "AI", "notes", "flashcards", "quiz", "learning"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-noise">
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
