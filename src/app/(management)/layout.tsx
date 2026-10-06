import { ManagementShell } from '@/components/management/ManagementShell';
import '@/styles/management.css';
import '@/styles/contract-print.css';

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <ManagementShell>{children}</ManagementShell>;
}
