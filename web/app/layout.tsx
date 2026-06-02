import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ideas Come True",
  description: "아이디어를 명세서와 제품화 로드맵으로 바꾸는 웹 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
