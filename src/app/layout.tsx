import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

// 본문 폰트는 Pretendard(웹 폰트, layout.tsx의 <link>로 로드)을 사용한다.
// 모노 폰트는 코드/숫자 표기에서만 가끔 쓰이므로 Geist Mono를 변수 폰트로 유지한다.
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PCF Insight Dashboard',
  description: 'Product Carbon Footprint overview for CT-045 Computer Monitor.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    // next-themes가 마운트 후 `dark` 클래스를 추가/제거하기 때문에
    // 초기 SSR HTML과 클라이언트 첫 렌더링이 잠깐 다를 수 있다.
    // suppressHydrationWarning으로 React의 hydration warning만 끄고,
    // 실제 컴포넌트 트리는 그대로 유지한다.
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
         * Pretendard variable font (dynamic subset).
         * Pretendard 공식 권장 CDN. 한글 사용 글자에 맞춘 동적 서브셋이라
         * 초기 로딩이 가볍다. preconnect로 첫 페인트 지연을 줄인다.
         */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
