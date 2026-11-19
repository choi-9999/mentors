import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '247멘토단 × 전국 지점 매칭 플랫폼',
  description: '247멘토단 멘토 스펙 등록 및 전국 지점 맞춤형 멘토링 매칭 시스템',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
