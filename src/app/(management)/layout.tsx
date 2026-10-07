import { ManagementShell } from '@/components/management/ManagementShell';
import { redirect } from 'next/navigation';
import { currentSessionUser, usesLocalAccounts } from '@/lib/server/management-session';
import '@/styles/management.css';
import '@/styles/contract-print.css';

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  const connected = usesLocalAccounts();
  const user = connected ? await currentSessionUser().catch(() => null) : null;
  if (connected && !user) redirect('/login');
  return <ManagementShell user={user}>{children}</ManagementShell>;
}
