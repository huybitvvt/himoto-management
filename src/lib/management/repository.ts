import { createDemoDataset, reconcileDataset } from '@/fixtures/management-data';
import { EditableKind, ManagementDataset, ManagementKind, ManagementRepository, ManagementRow } from './types';

export function createDemoRepository(): ManagementRepository {
  let dataset = createDemoDataset();
  return {
    source: 'demo',
    async load() { return structuredClone(dataset); },
    async save(kind: EditableKind, row: ManagementRow) {
      if (!['staff', 'customers', 'stores', 'vehicles'].includes(kind)) throw new Error('Danh sách hợp đồng chỉ đọc.');
      const records = dataset[kind];
      const existing = records.some(r => r.id === row.id);
      dataset = reconcileDataset({ ...dataset, [kind]: existing
        ? records.map(r => r.id === row.id ? { ...row } : r)
        : [{ ...row }, ...records] });
      return structuredClone(dataset);
    },
    async reset() { dataset = createDemoDataset(); return structuredClone(dataset); },
  };
}

// These GET routes are present in apps/api/src/modules/*/*.controller.ts.
export const READ_ENDPOINTS: Record<ManagementKind, string> = {
  staff: '/auth/hr/staff', customers: '/auth/customers', stores: '/auth/stores',
  vehicles: '/auth/vehicle/vehicles', contracts: '/auth/order/car-rental',
};
type ApiRow = Record<string, unknown>;
const text = (value: unknown): string => value == null ? '' : String(value);
const number = (value: unknown): number | undefined => value == null || value === '' || !Number.isFinite(Number(value)) ? undefined : Number(value);
const object = (value: unknown): ApiRow => value && typeof value === 'object' && !Array.isArray(value) ? value as ApiRow : {};

export function mapApiRow(kind: ManagementKind, raw: ApiRow): ManagementRow {
  const id = number(raw.id);
  if (id === undefined) throw new Error('API trả về bản ghi thiếu ID hợp lệ.');
  const base: ManagementRow = { id, code: text(raw.code || raw.staff_code) || `#${id}`,
    name: text(raw.name || raw.full_name || raw.store_name), status: text(raw.status),
    store_id: number(raw.current_store_id ?? raw.store_id), store_name: text(raw.store_name),
    phone: text(raw.phone || raw.store_phone), email: text(raw.email),
    address: text(raw.address || raw.store_address), created_at: text(raw.created_at),
  };
  if (kind === 'staff') return { ...base, position: text(raw.position), hire_date: text(raw.joined_at),
    status: ({ '1': 'active', '0': 'inactive' } as Record<string, string>)[base.status] || base.status };
  if (kind === 'stores') return { ...base, manager_name: text(raw.manager_name),
    vehicle_count: number(raw.vehicle_count), staff_count: number(raw.staff_count),
    status: ({ '1': 'active', '0': 'inactive' } as Record<string, string>)[base.status] || base.status };
  if (kind === 'customers') return { ...base, id_card: text(raw.id_card), warning_note: text(raw.warning),
    contract_count: number(raw.contract_count), status: raw.warning ? 'warning' :
      (({ '1': 'active', '0': 'draft' } as Record<string, string>)[base.status] || base.status) };
  if (kind === 'vehicles') return { ...base, license: text(raw.license), brand: text(raw.brand), type: text(raw.type),
    odometer: number(raw.odometer), daily_price: number(raw.daily_price), monthly_price: number(raw.monthly_price), year: text(raw.year),
    status: ({ rent: 'using', maintenance: 'repairing', holding: 'pending' } as Record<string, string>)[base.status] || base.status };
  const customer = object(raw.customer);
  const vehicles = Array.isArray(raw.vehicles) ? raw.vehicles.map(object) : [];
  return { ...base, code: text(raw.contract_number || raw.code) || `#${id}`, name: text(raw.contract_number || raw.code) || `#${id}`,
    customer_id: number(raw.customer_id), customer_name: text(raw.customer_name || customer.name),
    customer_phone: text(raw.customer_phone || customer.phone),
    vehicle_name: vehicles.map(v => text(v.name)).filter(Boolean).join(', '),
    license: vehicles.map(v => text(v.license)).filter(Boolean).join(', '),
    start_date: text(raw.start_date || raw.rent_at), end_date: text(raw.end_date || raw.return_at),
    total_amount: number(raw.total_amount ?? raw.total), deposit_amount: number(raw.deposit_amount),
    rental_type: text(raw.rental_type), notes: text(raw.notes),
    // Keep numeric/unrecognized statuses visible until the API contract is agreed.
  };
}

export function createApiRepository(baseUrl = '/api'): ManagementRepository {
  async function read(kind: ManagementKind): Promise<ManagementRow[]> {
    const records: ManagementRow[] = [];
    for (let page = 1; page <= 1000; page++) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('jwt_token') : null;
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}${READ_ENDPOINTS[kind]}?page=${page}&limit=100`, {
        method: 'GET', credentials: 'same-origin', headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!response.ok) throw new Error(`Không tải được ${kind} (HTTP ${response.status}). Kiểm tra kết nối và phiên đăng nhập.`);
      const envelope = object(await response.json());
      if (envelope.status && envelope.status !== 'success') throw new Error(`API ${kind} trả về trạng thái lỗi.`);
      const payload = envelope.data;
      const pagination = object(payload);
      const rows = Array.isArray(payload) ? payload : pagination.data;
      if (!Array.isArray(rows)) throw new Error(`API ${kind} trả về cấu trúc dữ liệu chưa được hỗ trợ.`);
      records.push(...rows.map(r => mapApiRow(kind, object(r))));
      if (Array.isArray(payload)) return records;
      const totalPages = number(pagination.last_page);
      const total = number(pagination.total);
      if (totalPages === undefined && total === undefined) throw new Error(`API ${kind} thiếu thông tin phân trang.`);
      if ((totalPages !== undefined && page >= totalPages) || (total !== undefined && records.length >= total)) return records;
      if (rows.length === 0) throw new Error(`API ${kind} trả về trang rỗng trước khi tải đủ dữ liệu.`);
    }
    throw new Error('Danh sách vượt giới hạn tải. Cần nối phân trang phía server trước khi vận hành.');
  }
  return {
    source: 'api',
    async load() {
      const kinds: ManagementKind[] = ['staff', 'customers', 'contracts', 'stores', 'vehicles'];
      const values = await Promise.all(kinds.map(read));
      const dataset = Object.fromEntries(kinds.map((kind, i) => [kind, values[i]])) as ManagementDataset;
      // Only resolve labels; API aggregates and contract values are never fabricated.
      for (const kind of ['staff', 'vehicles', 'contracts'] as const) {
        dataset[kind] = dataset[kind].map(row => ({ ...row, store_name: row.store_name || dataset.stores.find(s => s.id === row.store_id)?.name }));
      }
      return dataset;
    },
    async save() { throw new Error('Chức năng ghi API chưa được tích hợp.'); },
    async reset() { throw new Error('Không thể đặt lại dữ liệu API.'); },
  };
}

export function createManagementRepository(): ManagementRepository {
  return process.env.NEXT_PUBLIC_MANAGEMENT_DATA_SOURCE === 'api'
    ? createApiRepository(process.env.NEXT_PUBLIC_API_URL || '/api') : createDemoRepository();
}
