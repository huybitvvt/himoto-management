/**
 * Định dạng tiền tệ Việt Nam (VNĐ)
 */
export function formatMoney(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0 đ';
  }
  const num = Math.round(Number(amount));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
}

export const formatCurrency = formatMoney;


/**
 * Định dạng ngày giờ: YYYY-MM-DD HH:mm -> DD/MM/YYYY HH:mm
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

/**
 * Định dạng ngày: YYYY-MM-DD -> DD/MM/YYYY
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Danh sách trạng thái hợp đồng thuê xe
 */
export const ORDER_STATUS = [
  { value: '1', label: 'Tạo mới (Chưa cọc)', badgeClass: 'badge-secondary' },
  { value: '2', label: 'Đã đặt cọc', badgeClass: 'badge-info' },
  { value: '3', label: 'Đang thuê', badgeClass: 'badge-primary' },
  { value: '4', label: 'Hoàn thành', badgeClass: 'badge-success' },
  { value: '5', label: 'Đã hủy', badgeClass: 'badge-danger' },
  { value: '6', label: 'Quá hạn thuê', badgeClass: 'badge-warning' },
];

export function getOrderStatusBadge(status: number | string): { label: string; badgeClass: string } {
  const found = ORDER_STATUS.find(s => s.value === String(status));
  return found || { label: 'Không xác định', badgeClass: 'badge-light' };
}
