import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kolaba Cloud AI — Engineering Colleges Program Survey",
  description:
    "Conversational AI survey for engineering colleges across India on GPU compute access, mentorship, faculty training, and placement support.",
  keywords: [
    "Kolaba Cloud AI",
    "GPU Compute",
    "Engineering Colleges India",
    "AI Education",
    "GenAI Lab Sandbox",
    "Placement Support",
  ],
  authors: [{ name: "Kolaba Cloud AI", url: "https://kolabacloud.com" }],
  openGraph: {
    title: "Kolaba Cloud AI — Engineering Colleges Program Survey",
    description:
      "Understanding where GPU access, mentorship, faculty training, or placement support can make the biggest difference.",
    url: "https://kolabacloud.com",
    siteName: "Kolaba Cloud AI Survey",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-teal-100 selection:text-teal-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
