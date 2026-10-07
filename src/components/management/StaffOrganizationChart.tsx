'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Dialog } from './Dialog';
import { useManagement } from './ManagementProvider';

type Person = { name: string; title?: string; phones: string[] };
type Group = { title: string; people: Person[] };
type OrgChartData = { departments: Group[]; stores: { name: string; color: number; groups: Group[] }[] };

const STANDARD_CHART: OrgChartData = {
  departments: [
    { title: 'Vận hành (VH)', people: [{ name: 'Phan Công Minh', phones: ['0342567705'] }] },
    { title: 'Hành chính nhân sự (HCNS)', people: [{ name: 'Nguyễn Minh Tuấn', phones: ['0986268908', '0916683055'] }, { name: 'Vũ Hồng Diệp', phones: ['0944280985'] }] },
    { title: 'Quản lý công nợ', people: [{ name: 'Nguyễn Như Hoài Linh', title: 'Leader', phones: ['0988296110'] }, { name: 'Nguyễn Văn Nam', phones: ['0986547251', '0919549358'] }, { name: 'Phan Đức Minh', phones: ['0982392644', '0915923055'] }] },
    { title: 'Kế toán (KT)', people: [{ name: 'Nguyễn Như Hoài Linh', phones: ['0988296110'] }] },
    { title: 'BPSC', people: [{ name: 'Đỗ Đức Hưng', phones: ['0968630185'] }] },
    { title: 'Telesales (TLS)', people: [{ name: 'Hoàng Thị Kim Huệ', phones: ['0364788339', '0886184116'] }, { name: 'Nguyễn Như Thu Trang', phones: ['0347418746', '0855184116'] }] },
  ],
  stores: [
    { name: 'Cơ sở Nguyễn Hoàng', color: 0, groups: [
      { title: 'TPKD & NVKD', people: [{ name: 'Vi Văn Tường', title: 'TPKD', phones: ['0376541118'] }, { name: 'Vũ Hoàng Minh', title: 'NVKD', phones: ['0775284212'] }] },
      { title: 'PT', people: [{ name: 'Kiều Phương Anh', title: 'PT', phones: ['0325518898'] }, { name: 'Nguyễn Nhật Lili', title: 'PT', phones: ['0706355781'] }] },
    ] },
    { name: 'Cơ sở Láng', color: 1, groups: [
      { title: 'TPKD & NVKD', people: [{ name: 'Nguyễn Đức Anh', title: 'TPKD', phones: ['0395505622'] }, { name: 'Nguyễn Minh Hiếu', title: 'NVKD', phones: ['0394566430'] }] },
      { title: 'PT', people: [{ name: 'Hoàng Thị Yến Vi', title: 'PT', phones: ['0348444989'] }] },
    ] },
    { name: 'Cơ sở Thuốc Bắc', color: 2, groups: [
      { title: 'TPKD & NVKD', people: [{ name: 'Nguyễn Hải Đăng', title: 'TPKD', phones: ['0378784066'] }, { name: 'Nguyễn Quang Trường', title: 'NVKD', phones: ['0325378569'] }] },
    ] },
    { name: 'Cơ sở Hà Đông', color: 3, groups: [
      { title: 'TPKD & NVKD', people: [{ name: 'Trần Tấn Cảnh', title: 'TPKD', phones: ['0974992405'] }, { name: 'Phạm Quốc Cường', title: 'NVKD', phones: ['0355403060'] }] },
      { title: 'PT', people: [{ name: 'Đinh Ngọc Phụng', title: 'PT', phones: ['0386125866'] }] },
    ] },
    { name: 'Cơ sở Giáp Bát', color: 4, groups: [
      { title: 'TPKD & NVKD', people: [{ name: 'Nguyễn Thị Vui', title: 'TPKD', phones: ['0396589623'] }, { name: 'Hà Viết Giang', title: 'NVKD', phones: ['0333648392'] }, { name: 'Lê Duy Thùy', title: 'NVKD', phones: ['0963165055'] }] },
      { title: 'PT', people: [{ name: 'Lê Trần Hiền', title: 'PT', phones: ['0778430858'] }] },
    ] },
    { name: 'Cơ sở Thuê sở hữu', color: 5, groups: [
      { title: 'TPKD & NVKD', people: [{ name: 'Nguyễn Như Hoài Linh', title: 'Leader', phones: ['0988296110'] }] },
    ] },
  ],
};

function PersonCard({ person }: { person: Person }) {
  return <div className="mg-org-person"><strong>{person.name}{person.title ? ` (${person.title})` : ''}</strong><span>{person.phones.map((phone, index) => <span className="mg-org-phone" key={phone}>{index > 0 && <i aria-hidden="true">|</i>}<a href={`tel:${phone}`}>{phone}</a></span>)}</span></div>;
}

export function StaffOrganizationChart() {
  const { source, notify, reload } = useManagement();
  const [chart, setChart] = useState<OrgChartData>(() => structuredClone(STANDARD_CHART));
  const [confirmRefill, setConfirmRefill] = useState(false);
  const [refilling, setRefilling] = useState(false);
  const [refillError, setRefillError] = useState('');
  function refill() {
    if (source === 'api') { setRefillError(''); setConfirmRefill(true); return; }
    setChart(structuredClone(STANDARD_CHART));
    notify('Đã điền lại sơ đồ mẫu theo ảnh chuẩn.');
  }
  async function confirmAndRefill() {
    if (refilling) return;
    setRefilling(true); setRefillError('');
    try {
      const response = await fetch('/api/auth/hr/staff/refill-branches', { method: 'POST', headers: { Accept: 'application/json' } });
      const payload = await response.json().catch(() => null) as { status?: unknown; data?: { matched?: unknown; updated?: unknown }; message?: unknown } | null;
      if (!response.ok || payload?.status !== 'success' || !payload.data) {
        throw new Error(typeof payload?.message === 'string' ? payload.message : 'Không điền lại được cơ sở nhân sự. Hãy thử lại.');
      }
      const matched = Number(payload.data.matched || 0);
      const updated = Number(payload.data.updated || 0);
      await reload();
      setChart(structuredClone(STANDARD_CHART)); setConfirmRefill(false);
      notify(`Đã đối chiếu ${matched} hồ sơ và điền lại ${updated} cơ sở. Hồ sơ không khớp số điện thoại được bỏ qua.`);
    } catch (cause) {
      setRefillError(cause instanceof Error ? cause.message : 'Không điền lại được cơ sở nhân sự. Hãy thử lại.');
    } finally { setRefilling(false); }
  }

  return <section className="mg-org-section" aria-labelledby="staff-org-title">
    <div className="mg-org-heading"><div><span className="mg-eyebrow">CƠ CẤU TỔ CHỨC</span><h2 id="staff-org-title">Sơ đồ nhân sự</h2><p>Sơ đồ phòng ban và phân bổ nhân sự tại các cơ sở.</p></div>
      <button type="button" className="mg-button" onClick={refill}><RotateCcw size={16} />Điền lại</button></div>
    <div className="mg-org-scroll" tabIndex={0} role="region" aria-label="Sơ đồ tổ chức, cuộn ngang để xem đầy đủ">
      <div className="mg-org-chart">
        <div className="mg-org-root">BAN GIÁM ĐỐC</div>
        <div className="mg-org-departments">{chart.departments.map((department, index) => <article className={`mg-org-card mg-org-tone-${index}`} key={department.title}>
          <h3>{department.title}</h3><div className="mg-org-people">{department.people.map(person => <PersonCard key={`${person.name}-${person.title || ''}`} person={person} />)}</div>
        </article>)}</div>
        <div className="mg-org-stores">{chart.stores.map(store => <article className={`mg-org-store mg-org-tone-${store.color}`} key={store.name}>
          <h3>{store.name}</h3>{store.groups.map(group => <section className="mg-org-group" key={group.title}>
            <h4>{group.title}</h4><div className="mg-org-people">{group.people.map(person => <PersonCard key={`${person.name}-${person.title || ''}`} person={person} />)}</div>
          </section>)}
        </article>)}</div>
      </div>
    </div>
    {confirmRefill && <Dialog title="Điền lại cột Cơ sở?" subtitle="Cập nhật trực tiếp hồ sơ nhân sự trên Supabase" onClose={() => { if (!refilling) setConfirmRefill(false); }}>
      <div className="mg-dialog-body"><p>Đối chiếu số điện thoại trong sơ đồ để gán lại cơ sở cho nhân sự. Chỉ cập nhật cột Cơ sở; tên, số điện thoại và chức vụ được giữ nguyên. Hồ sơ không khớp sẽ được bỏ qua.</p>{refillError && <p className="mg-error-message" role="alert">{refillError}</p>}</div>
      <div className="mg-dialog-footer"><button type="button" className="mg-button" disabled={refilling} onClick={() => setConfirmRefill(false)}>Hủy</button><button type="button" className="mg-button mg-button-primary" disabled={refilling} onClick={() => void confirmAndRefill()}>{refilling ? 'Đang điền lại…' : 'Xác nhận điền lại'}</button></div>
    </Dialog>}
  </section>;
}
