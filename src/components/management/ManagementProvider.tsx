'use client';

import { createContext, useCallback, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { createManagementRepository } from '@/lib/management/repository';
import { ContractEdits, CustomerAssignment, EditableKind, ManagementDataset, ManagementRepository, ManagementRow } from '@/lib/management/types';
import { ContractAutofillRepository, createApiAutofillRepository, createDemoAutofillRepository } from '@/lib/management/contract-autofill';
import { CustomerDetails } from '@/lib/management/contract-document';
import { reconcileDataset } from '@/fixtures/management-data';

interface ManagementContextValue {
  dataset: ManagementDataset | null;
  loading: boolean;
  error: string;
  source: 'demo' | 'api';
  canSaveContractDrafts: boolean;
  selectedStore: string;
  selectStore: (id: string) => void;
  reload: () => Promise<void>;
  reset: () => Promise<void>;
  save: (kind: EditableKind, row: ManagementRow) => Promise<void>;
  notify: (message: string) => void;
  contractAutofill: ContractAutofillRepository;
  createCustomer: (customer: CustomerDetails, assignment?: CustomerAssignment) => Promise<ManagementRow>;
  updateCustomer: (customer: ManagementRow) => Promise<ManagementRow>;
  deleteCustomer: (id: number) => Promise<void>;
  cloneContract: (id: number) => Promise<ManagementRow>;
  saveContract: (id: number, edits: ContractEdits) => Promise<ManagementRow>;
  saveContractDraft: (id: number | null, edits: ContractEdits) => Promise<ManagementRow>;
}
const ManagementContext = createContext<ManagementContextValue | null>(null);

export function ManagementProvider({ children }: { children: ReactNode }) {
  const [repository] = useState<ManagementRepository>(createManagementRepository);
  const contractAutofill = useMemo(() => repository.source === 'api' ? createApiAutofillRepository(process.env.NEXT_PUBLIC_API_URL || '/api') : createDemoAutofillRepository(repository), [repository]);
  const [dataset, setDataset] = useState<ManagementDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStore, selectStore] = useState('all');
  const [notification, notify] = useState('');

  const reload = useCallback(async () => {
    setLoading(true); setError(''); setDataset(null);
    try { setDataset(await repository.load()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không tải được dữ liệu. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  }, [repository]);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => notify(''), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const save = async (kind: EditableKind, row: ManagementRow) => {
    setDataset(await repository.save(kind, row));
    notify('Đã cập nhật dữ liệu mẫu. Thay đổi chỉ lưu trong phiên xem trước.');
  };
  const reset = async () => {
    setDataset(await repository.reset()); selectStore('all');
    notify('Đã khôi phục dữ liệu mẫu ban đầu.');
  };
  const cloneContract = async (id: number) => {
    const result = await repository.cloneContract(id);
    setDataset(result.dataset);
    notify(`Đã sao chép thành ${result.row.code} · ID ${result.row.id}. Đang mở form chỉnh sửa. Chỉ lưu trong phiên xem trước.`);
    return result.row;
  };
  const saveContract = async (id: number, edits: ContractEdits) => {
    const result = await repository.saveContract(id, edits);
    setDataset(result.dataset);
    notify(`Đã lưu ${result.row.code}. Thay đổi chỉ lưu trong phiên xem trước.`);
    return result.row;
  };
  const saveContractDraft = async (id: number | null, edits: ContractEdits) => {
    const result = await repository.saveContractDraft(id, edits);
    setDataset(result.dataset);
    notify(`Đã lưu nháp ${result.row.code}${repository.source === 'demo' ? ' trong trình duyệt này' : ' vào Supabase'}. Mở mục Lưu nháp để tiếp tục chỉnh sửa.`);
    return result.row;
  };
  const createCustomer = async (customer: CustomerDetails, assignment?: CustomerAssignment) => {
    const row = await contractAutofill.createCustomer(customer, assignment);
    setDataset(current => {
      if (!current) return current;
      const next = { ...current, customers: [row, ...current.customers.filter(item => item.id !== row.id)] };
      return repository.source === 'demo' ? reconcileDataset(next) : next;
    });
    notify(repository.source === 'demo' ? 'Đã thêm khách hàng mẫu và điền vào hợp đồng. Chỉ lưu trong phiên xem trước.' : 'Đã tạo khách hàng và điền vào hợp đồng.');
    return row;
  };
  const updateCustomer = async (customer: ManagementRow) => {
    const updated = await contractAutofill.updateCustomer(customer);
    const current = dataset?.customers.find(item => item.id === updated.id);
    const row = { ...updated, code: customer.code, store_name: dataset?.stores.find(store => store.id === updated.store_id)?.name || '', contract_count: current?.contract_count ?? customer.contract_count ?? 0 };
    setDataset(current => current ? { ...current, customers: current.customers.map(item => item.id === row.id ? row : item) } : current);
    notify(repository.source === 'demo' ? 'Đã cập nhật khách hàng mẫu trong phiên xem trước.' : 'Đã cập nhật hồ sơ khách hàng trong Supabase.');
    return row;
  };
  const deleteCustomer = async (id: number) => {
    await contractAutofill.deleteCustomer(id);
    setDataset(current => current ? { ...current, customers: current.customers.filter(item => item.id !== id) } : current);
    notify(repository.source === 'demo' ? 'Đã xóa khách hàng khỏi phiên xem trước.' : 'Đã xóa hồ sơ khách hàng khỏi Supabase.');
  };
  return <ManagementContext.Provider value={{ dataset, loading, error, source: repository.source, canSaveContractDrafts: repository.source === 'demo' || Boolean(repository.supportsContractDrafts), selectedStore, selectStore, reload, reset, save, notify, contractAutofill, createCustomer, updateCustomer, deleteCustomer, cloneContract, saveContract, saveContractDraft }}>
    {children}
    {notification && <div className="mg-toast" role="status"><span>{notification}</span><button type="button" onClick={() => notify('')} aria-label="Đóng thông báo">×</button></div>}
  </ManagementContext.Provider>;
}

export function useManagement() {
  const context = useContext(ManagementContext);
  if (!context) throw new Error('ManagementProvider is required.');
  return context;
}
