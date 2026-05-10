import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "廿载交汇 · 故事还原",
  description: "博物馆互动叙事原型（单机本地闭环）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
