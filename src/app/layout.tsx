import type { Metadata } from 'next';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/900.css';
import '@/styles/base.css';

export const metadata: Metadata = {
  title: 'HIMOTO — Quản lý vận hành',
  description: 'Nhân sự, khách hàng, hợp đồng, cơ sở và danh sách xe HIMOTO.',
  icons: { icon: '/images/branding/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
