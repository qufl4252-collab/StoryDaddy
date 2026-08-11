import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://storybook-dad-korea.jojojojo.chatgpt.site"),
  title: "도담도담 동화나라",
  description: "아빠와 아이가 목소리로 이어 가고, 매일 새로운 동화를 만나는 공간",
  openGraph: {
    title: "도담도담 동화나라",
    description: "동화 대화와 동화 작가, 두 개의 이야기 방을 만나보세요.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "도담도담 동화나라",
    description: "동화 대화와 동화 작가, 두 개의 이야기 방을 만나보세요.",
    images: ["/og.png"],
  },
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
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
