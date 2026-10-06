'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { createManagementRepository } from '@/lib/management/repository';
import { EditableKind, ManagementDataset, ManagementRepository, ManagementRow } from '@/lib/management/types';

interface ManagementContextValue {
  dataset: ManagementDataset | null;
  loading: boolean;
  error: string;
  source: 'demo' | 'api';
  selectedStore: string;
  selectStore: (id: string) => void;
  reload: () => Promise<void>;
  reset: () => Promise<void>;
  save: (kind: EditableKind, row: ManagementRow) => Promise<void>;
  notify: (message: string) => void;
}
const ManagementContext = createContext<ManagementContextValue | null>(null);

export function ManagementProvider({ children }: { children: ReactNode }) {
  const [repository] = useState<ManagementRepository>(createManagementRepository);
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
  return <ManagementContext.Provider value={{ dataset, loading, error, source: repository.source, selectedStore, selectStore, reload, reset, save, notify }}>
    {children}
    {notification && <div className="mg-toast" role="status"><span>{notification}</span><button type="button" onClick={() => notify('')} aria-label="Đóng thông báo">×</button></div>}
  </ManagementContext.Provider>;
}

export function useManagement() {
  const context = useContext(ManagementContext);
  if (!context) throw new Error('ManagementProvider is required.');
  return context;
}
