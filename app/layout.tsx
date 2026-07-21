import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "AZNutrition — Food Nutrition Analysis",
  description:
    "Look up nutrition facts, Nutri-Score, NOVA processing levels, ingredients, and additives for any food product by barcode or Amazon link.",
  keywords: ["nutrition", "nutri-score", "food additives", "ingredients", "barcode", "open food facts"],
  authors: [{ name: "AZNutrition" }],
  openGraph: {
    title: "AZNutrition — Food Nutrition Analysis",
    description: "Nutrition facts, Nutri-Score, and additives for any food product.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-surface font-sans text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
