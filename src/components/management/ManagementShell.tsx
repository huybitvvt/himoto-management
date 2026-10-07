'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bike, Building2, ChevronDown, ChevronRight, ContactRound, FilePenLine, Files, Menu, PanelLeftClose, RotateCcw, UsersRound, Wallet, X } from 'lucide-react';
import { ManagementProvider, useManagement } from './ManagementProvider';
import { Dialog, trapFocusWithin } from './Dialog';

const navigation = [
  { href: '/staff', label: 'Nhân sự', kind: 'staff' as const, icon: UsersRound },
  { href: '/customers', label: 'Khách hàng', kind: 'customers' as const, icon: ContactRound },
  { href: '/contracts', label: 'Danh sách hợp đồng', kind: 'contracts' as const, icon: Files },
  { href: '/contracts/drafts', label: 'Lưu nháp', kind: 'contracts' as const, icon: FilePenLine },
  { href: '/stores', label: 'Cơ sở', kind: 'stores' as const, icon: Building2 },
  { href: '/vehicles', label: 'Danh sách xe', kind: 'vehicles' as const, icon: Bike },
  { href: '/cashbook', label: 'Sổ quỹ / Sổ két', kind: 'cashbook' as const, icon: Wallet },
];

function Shell({ children }: { children: ReactNode }) {
  const { dataset, selectedStore, selectStore, source, canSaveContractDrafts, reset } = useManagement();
  const pathname = usePathname();
  const active = navigation.find(n => pathname === n.href) || navigation.find(n => n.kind === 'vehicles')!;
  const writableCustomers = source === 'api' && active.kind === 'customers';
  const writableDrafts = source === 'api' && active.kind === 'contracts' && canSaveContractDrafts;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const mobileRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    if (mobileOpen) mobileRef.current?.showModal(); else mobileRef.current?.close();
    if (!mobileOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const releaseFocus = mobileRef.current ? trapFocusWithin(mobileRef.current) : () => {};
    return () => { releaseFocus(); document.body.style.overflow = overflow; };
  }, [mobileOpen]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) menuRef.current.open = false; };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const navContent = <>
    <Link href="/vehicles" className="mg-brand" aria-label="HIMOTO - Danh sách xe" onClick={() => setMobileOpen(false)}>
      {/* Existing brand asset, kept in its original proportions. */}
      <img src="/images/branding/logo-himoto-dark.svg" width="154" height="32" alt="HIMOTO" />
      <span>HỆ THỐNG QUẢN LÝ</span>
    </Link>
    <div className="mg-workspace"><span className="mg-workspace-symbol"><Building2 size={19} /></span><div><strong>HIMOTO Workspace</strong><small>Quản lý vận hành</small></div></div>
    <p className="mg-nav-caption">DANH MỤC QUẢN LÝ</p>
    <nav aria-label="Điều hướng quản lý">{navigation.map(item => <Link key={item.href} href={item.href}
      className={`mg-nav-link ${active.href === item.href ? 'is-active' : ''}`} aria-current={active.href === item.href ? 'page' : undefined}
      title={collapsed ? item.label : undefined} onClick={() => setMobileOpen(false)}>
      <item.icon size={19} strokeWidth={1.8} /><span>{item.label}</span>{active.href === item.href && <ChevronRight className="mg-nav-arrow" size={15} />}
    </Link>)}</nav>
    <div className="mg-sidebar-bottom"><div className="mg-source-marker"><span />{source === 'demo' ? 'Phiên xem trước' : writableDrafts ? 'Supabase · có thể lưu nháp' : writableCustomers ? 'Supabase · khách hàng có thể sửa' : 'Dữ liệu API · chỉ đọc'}</div>
      <p>{source === 'demo' ? 'Dữ liệu mẫu để duyệt giao diện.' : writableDrafts ? 'Lưu và tiếp tục sửa hợp đồng đang soạn.' : writableCustomers ? 'Thêm, cập nhật và xóa hồ sơ khách hàng trực tiếp.' : 'Kết nối dữ liệu từ hệ thống.'}</p><span className="mg-version">HIMOTO MANAGEMENT / 01</span></div>
  </>;

  return <div className={`mg-app ${collapsed ? 'mg-is-collapsed' : ''}`}>
    <a href="#management-main" className="mg-skip">Đến nội dung chính</a>
    <aside className="mg-sidebar">{navContent}</aside>
    <dialog ref={mobileRef} className="mg-mobile-nav" aria-label="Menu điều hướng" onCancel={event => { event.preventDefault(); setMobileOpen(false); }}>
      <button type="button" className="mg-icon-button mg-mobile-close" aria-label="Đóng menu" onClick={() => setMobileOpen(false)}><X size={20} /></button>{navContent}
    </dialog>
    <div className="mg-main">
      <header className="mg-topbar">
        <div className="mg-breadcrumb"><button type="button" className="mg-icon-button mg-desktop-toggle" aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} onClick={() => setCollapsed(!collapsed)}><PanelLeftClose size={19} /></button>
          <button type="button" className="mg-icon-button mg-mobile-toggle" aria-label="Mở menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <span>Quản lý</span><ChevronRight size={14} /><strong>{active.label}</strong></div>
        <div className="mg-topbar-right"><label className="mg-branch-select"><Building2 size={16} /><span className="mg-sr-only">Cơ sở đang xem</span><select value={selectedStore} onChange={event => selectStore(event.target.value)}>
          <option value="all">Tất cả cơ sở</option>{dataset?.stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <span className={`mg-source-badge ${source === 'api' ? 'is-api' : ''}`}>{source === 'demo' ? 'Dữ liệu mẫu' : writableDrafts ? 'Lưu nháp' : writableCustomers ? 'Có thể sửa' : 'Chỉ đọc'}</span>
          <details className="mg-user-menu" ref={menuRef}><summary aria-label="Menu người dùng"><span className="mg-user-avatar">QT</span><div><strong>Quản trị viên</strong><small>{source === 'demo' ? 'Tài khoản mẫu' : writableCustomers ? 'Supabase' : 'Phiên tra cứu'}</small></div><ChevronDown size={14} /></summary>
            <div className="mg-popover"><strong>{source === 'demo' ? 'Phiên xem trước giao diện' : writableCustomers ? 'Khách hàng kết nối Supabase' : 'Phiên tra cứu API'}</strong><p>{source === 'demo' ? 'Bản nháp hợp đồng được giữ trong trình duyệt này. Các thay đổi dữ liệu mẫu khác mất khi tải lại trang.' : writableCustomers ? 'Thêm và cập nhật lưu trực tiếp; xóa hồ sơ có đơn thuê sẽ bị chặn để giữ lịch sử.' : 'Thao tác ghi dữ liệu chưa được tích hợp cho danh mục này.'}</p>
              {source === 'demo' && <button type="button" onClick={() => { if (menuRef.current) menuRef.current.open = false; setResetOpen(true); }}><RotateCcw size={16} />Khôi phục dữ liệu mẫu</button>}
              <Link href="/contracts/drafts"><FilePenLine size={16} />Mở danh sách lưu nháp</Link></div></details>
        </div>
      </header>
      <main id="management-main" className="mg-content" tabIndex={-1}>{children}</main>
      <footer className="mg-app-footer"><span>HIMOTO <span className="mg-footer-dot">·</span> Quản lý vận hành</span><span>{source === 'demo' ? 'Bản xem trước · Chưa kết nối dữ liệu thật' : writableDrafts ? 'Lưu nháp · Lưu trên hệ thống' : writableCustomers ? 'Khách hàng · Ghi trực tiếp vào Supabase' : 'Chế độ tra cứu · Không ghi dữ liệu'}</span></footer>
    </div>
    {resetOpen && <Dialog title="Khôi phục dữ liệu mẫu?" subtitle="Các thay đổi mẫu và bản nháp lưu trong trình duyệt sẽ bị bỏ." onClose={() => { if (!resetting) setResetOpen(false); }}>
      <div className="mg-dialog-body"><p>Dữ liệu thật của hệ thống không bị ảnh hưởng.</p>{resetError && <p className="mg-field-error" role="alert">{resetError}</p>}</div>
      <div className="mg-dialog-footer"><button className="mg-button" disabled={resetting} onClick={() => setResetOpen(false)}>Hủy</button><button className="mg-button mg-button-primary" disabled={resetting} onClick={async () => { setResetting(true); setResetError(''); try { await reset(); setResetOpen(false); } catch (cause) { setResetError(cause instanceof Error ? cause.message : 'Không khôi phục được dữ liệu.'); } finally { setResetting(false); } }}>{resetting ? 'Đang khôi phục…' : 'Khôi phục'}</button></div>
    </Dialog>}
  </div>;
}

export function ManagementShell({ children }: { children: ReactNode }) {
  return <ManagementProvider><Shell>{children}</Shell></ManagementProvider>;
}
