import { ManagementShell } from '@/components/management/ManagementShell';
import '@/styles/management.css';

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <ManagementShell>{children}</ManagementShell>;
}
