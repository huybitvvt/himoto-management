'use client';

import { useEffect, useRef } from 'react';
import { RentalDetailModal } from '@/components/rental/RentalDetailModal';
import { RentalOrderItem } from '@/components/rental/RentalOrderTable';
import { ManagementRow } from '@/lib/management/types';
import { MANAGEMENT_CONFIG, optionLabel } from '@/lib/management/config';

/** Reuse the existing rental detail renderer; do not create another contract screen. */
export function ContractDetail({ row, onClose, onPrint }: { row: ManagementRow; onClose: () => void; onPrint: () => void }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const modal = wrapper.current?.querySelector<HTMLElement>('[role="dialog"]');
    modal?.setAttribute('aria-modal', 'true');
    modal?.setAttribute('aria-label', `Chi tiết hợp đồng ${row.code}`);
    const buttons = () => Array.from(wrapper.current?.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]') || []).filter(element => element.getClientRects().length > 0);
    buttons()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key === 'Tab') {
        const elements = buttons();
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const siblings = [document.querySelector<HTMLElement>('.mg-sidebar'), document.querySelector<HTMLElement>('.mg-topbar'), document.querySelector<HTMLElement>('.mg-app-footer'), wrapper.current?.parentElement?.querySelector<HTMLElement>('.mg-page-content')];
    const previousInert = siblings.map(element => element?.inert);
    siblings.forEach(element => { if (element) element.inert = true; });
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = overflow;
      siblings.forEach((element, index) => { if (element) element.inert = Boolean(previousInert[index]); }); previousFocus?.focus(); };
  }, [row.code]);
  const statuses: Record<string, number> = { pending: 1, renting: 3, completed: 4, cancelled: 5, overdue: 6 };
  const order: RentalOrderItem = {
    id: row.id, contract_number: row.code, customer: { name: String(row.customer_name || ''), phone: String(row.customer_phone || '') },
    store: { name: String(row.store_name || '') }, vehicles: [{ name: String(row.vehicle_name || ''), license: String(row.license || '') }],
    start_date: String(row.start_date || ''), end_date: String(row.end_date || ''), created_at: String(row.created_at || ''),
    deposit_amount: Number(row.deposit_amount), total_amount: Number(row.total_amount),
    status: statuses[row.status] || Number(row.status),
  };
  return <div ref={wrapper} className="mg-contract-preview"><RentalDetailModal order={order} isOpen onClose={onClose} onPrint={onPrint}
    statusLabel={optionLabel(MANAGEMENT_CONFIG.contracts, 'status', row.status)}
    missingAmounts={{ deposit: row.deposit_amount === undefined, total: row.total_amount === undefined }} /></div>;
}
