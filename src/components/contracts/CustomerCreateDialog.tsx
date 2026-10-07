'use client';

import { FormEvent, useRef, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { Dialog } from '@/components/management/Dialog';
import { useManagement } from '@/components/management/ManagementProvider';
import { CustomerDetails, customerDetails, validateCustomer } from '@/lib/management/contract-document';
import { ManagementRow } from '@/lib/management/types';
import { CUSTOMER_STATUSES } from '@/lib/management/config';

export function CustomerCreateDialog({ idCard, storeId, onCreated, onClose }: { idCard: string; storeId?: string; onCreated: (row: ManagementRow) => void; onClose: () => void }) {
  const { source, dataset, selectedStore, createCustomer } = useManagement();
  const [branch, setBranch] = useState(storeId || (selectedStore !== 'all' ? selectedStore : String(dataset?.stores[0]?.id || '')));
  const [status, setStatus] = useState('active');
  const [customer, setCustomer] = useState<CustomerDetails>(() => ({ ...customerDetails(), id_card: idCard }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const fields: { key: keyof CustomerDetails; label: string; type?: string; required?: boolean; wide?: boolean }[] = [
    { key: 'id_card', label: 'CCCD / CMND', required: true }, { key: 'name', label: 'Họ và tên', required: true },
    { key: 'phone', label: 'Số điện thoại', type: 'tel', required: true }, { key: 'email', label: 'Email', type: 'email' },
    { key: 'address', label: 'Địa chỉ', required: true, wide: true },
    ...(source === 'demo' ? [{ key: 'id_card_issued_on' as const, label: 'Ngày cấp giấy tờ', type: 'date' },
      { key: 'id_card_issued_by' as const, label: 'Nơi cấp giấy tờ' }, { key: 'birthday' as const, label: 'Ngày sinh', type: 'date' },
      { key: 'relatives_text' as const, label: 'Thông tin người thân', wide: true }, { key: 'warning_note' as const, label: 'Ghi chú / cảnh báo', wide: true }] : []),
  ];
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy.current) return;
    const next = validateCustomer(customer, source);
    if (source === 'demo' && !dataset?.stores.some(store => String(store.id) === branch)) next.store_id = 'Chọn cơ sở cho khách hàng.';
    setErrors(next); setError('');
    if (Object.keys(next).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    busy.current = true; setSaving(true);
    try {
      const assignment = source === 'demo' ? { status, store_id: Number(branch) } : storeId ? { status: 'active', store_id: Number(storeId) } : undefined;
      onCreated(await createCustomer(customer, assignment));
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không tạo được khách hàng. Vui lòng thử lại.'); }
    finally { busy.current = false; setSaving(false); }
  }
  return <Dialog title="Thêm khách hàng tại chỗ" subtitle={source === 'demo' ? 'Khách hàng mẫu · Tự động điền vào hợp đồng sau khi lưu' : 'Tự động điền vào hợp đồng sau khi lưu'} onClose={() => { if (!busy.current) onClose(); }}>
    <form ref={form} noValidate onSubmit={submit}>
      <div className="mg-dialog-body"><div className="mg-form-grid">{fields.map(field => <div className={`mg-field ${field.wide ? 'mg-field-wide' : ''}`} key={field.key}>
        <label htmlFor={`new-customer-${field.key}`}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>
        <input id={`new-customer-${field.key}`} name={field.key} type={field.type || 'text'} value={customer[field.key]} disabled={saving} required={field.required}
          aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `new-customer-${field.key}-error` : undefined}
          onChange={event => { setCustomer(current => ({ ...current, [field.key]: event.target.value })); setErrors(current => ({ ...current, [field.key]: '' })); }} />
        {errors[field.key] && <p className="mg-field-error" id={`new-customer-${field.key}-error`}>{errors[field.key]}</p>}
      </div>)}{source === 'demo' && <>
        <div className="mg-field"><label htmlFor="new-customer-store">Cơ sở *</label><select id="new-customer-store" value={branch} disabled={saving} aria-invalid={Boolean(errors.store_id)} aria-describedby={errors.store_id ? 'new-customer-store-error' : undefined} onChange={event => { setBranch(event.target.value); setErrors(current => ({ ...current, store_id: '' })); }}>
          <option value="">Chọn cơ sở</option>{dataset?.stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}</select>{errors.store_id && <p id="new-customer-store-error" className="mg-field-error">{errors.store_id}</p>}</div>
        <div className="mg-field"><label htmlFor="new-customer-status">Trạng thái hồ sơ *</label><select id="new-customer-status" value={status} disabled={saving} onChange={event => setStatus(event.target.value)}>{CUSTOMER_STATUSES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      </>}</div>{error && <p className="mg-error-message" role="alert">{error}</p>}</div>
      <div className="mg-dialog-footer"><button type="button" className="mg-button" disabled={saving} onClick={onClose}>Hủy</button>
        <button type="submit" className="mg-button mg-button-primary" disabled={saving}>{saving ? <LoaderCircle size={16} className="mg-spin" /> : <Check size={16} />}{saving ? 'Đang lưu…' : source === 'demo' ? 'Lưu khách hàng mẫu' : 'Lưu khách hàng'}</button></div>
    </form>
  </Dialog>;
}
