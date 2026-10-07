'use client';

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Printer } from 'lucide-react';
import { Dialog } from '@/components/management/Dialog';
import { LegacyContractDocument } from '@/lib/management/contract-document';
import { ContractPrintDocument } from './ContractPrintDocument';

export function ContractPrintPreview({ doc, onClose }: { doc: LegacyContractDocument; onClose: () => void }) {
  const paper = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const busy = useRef(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => { frame.current?.remove(); }, []);
  async function print() {
    if (busy.current) return;
    busy.current = true; setPrinting(true); setError('');
    try {
      const source = paper.current?.querySelector('.contract-print-wrapper');
      if (!source) throw new Error('Chưa tải xong mẫu in.');
      frame.current?.remove();
      const iframe = document.createElement('iframe'); frame.current = iframe;
      iframe.title = 'Bản in hợp đồng'; iframe.className = 'mg-contract-print-frame';
      document.body.appendChild(iframe);
      const target = iframe.contentDocument;
      if (!target || !iframe.contentWindow) throw new Error('Không mở được bản in.');
      if (typeof iframe.contentWindow.print !== 'function') throw new Error('Trình duyệt này không hỗ trợ in trực tiếp. Hãy mở trang bằng Chrome, Edge hoặc Firefox trên máy tính rồi thử lại.');
      target.title = `HIMOTO - ${doc.contract_number}`;
      target.documentElement.lang = 'vi'; target.body.className = 'himoto-contract-frame';
      target.body.style.margin = '0';
      const styles: Promise<void>[] = [];
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
        const copy = node.cloneNode(true) as HTMLElement;
        if (copy instanceof HTMLLinkElement) { copy.href = (node as HTMLLinkElement).href; styles.push(new Promise<void>((resolve, reject) => { copy.onload = () => resolve(); copy.onerror = () => reject(new Error('Không tải được định dạng mẫu in.')); })); }
        target.head.appendChild(copy);
      });
      target.body.appendChild(source.cloneNode(true));
      await Promise.all(styles); await target.fonts.ready;
      iframe.contentWindow.addEventListener('afterprint', () => { iframe.remove(); if (frame.current === iframe) frame.current = null; }, { once: true });
      iframe.contentWindow.focus(); iframe.contentWindow.print();
    } catch (cause) {
      frame.current?.remove(); frame.current = null;
      const message = cause instanceof Error ? cause.message : '';
      setError(message.includes('định dạng mẫu in')
        ? 'Không tải được định dạng của hợp đồng nên chưa thể in. Kiểm tra kết nối mạng rồi bấm “In hợp đồng” để thử lại.'
        : message || 'Không mở được hộp thoại in. Hãy thử lại; nếu vẫn lỗi, mở trang bằng Chrome hoặc Edge và kiểm tra quyền in của trình duyệt.');
    }
    finally { busy.current = false; setPrinting(false); }
  }
  return <Dialog title="Xem trước mẫu in hợp đồng" subtitle="Mẫu cũ · A4 ngang · Bản nháp chưa phát hành" className="mg-contract-print-dialog" onClose={() => { if (!busy.current) onClose(); }}>
    <div className="mg-contract-print-toolbar"><p>Kiểm tra thông tin trước khi in. Có thể chọn “Lưu dưới dạng PDF” trong hộp thoại in. Nếu hộp thoại không xuất hiện, bấm “In hợp đồng” lần nữa hoặc thử Chrome / Edge.</p>
      <button className="mg-button mg-button-primary" type="button" onClick={() => void print()} disabled={printing}>{printing ? <LoaderCircle size={16} className="mg-spin" /> : <Printer size={16} />}{printing ? 'Đang chuẩn bị…' : 'In hợp đồng'}</button></div>
    {error && <p className="mg-error-message" role="alert">{error}</p>}
    <div className="mg-contract-paper-scroll" tabIndex={0} role="region" aria-label="Mẫu hợp đồng A4 ngang, cuộn để xem toàn bộ" ref={paper}><ContractPrintDocument doc={doc} /></div>
    <div className="mg-dialog-footer"><button type="button" className="mg-button" onClick={onClose} disabled={printing}>Quay lại thông tin</button></div>
  </Dialog>;
}
