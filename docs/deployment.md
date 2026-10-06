# Triển khai HIMOTO Management — 06/10/2026

- Repo private: https://github.com/huybitvvt/himoto-management
- Production: https://himoto-management.vercel.app
- Vercel project: `huybitvvts-projects/himoto-management`, kết nối repo GitHub, nhánh `main`.
- Source frontend đã triển khai: commit `8b567b9`.
- Mã cục bộ: `E:\himoto-management`.

## Kiểm chứng

`npm ci`, TypeScript, lint toàn bộ frontend và production build đều thành công. Có 8 kiểm tra dữ liệu/adapter và 8 nhóm kiểm tra tương tác browser đạt trên cả production cục bộ và URL Vercel.

Trang `/` và các đường dẫn `/staff`, `/customers`, `/contracts`, `/stores`, `/vehicles` trả HTTP 200 khi truy cập không đăng nhập Vercel. Chụp đủ 5 màn ở 1440px và 375px; không tràn ngang trang, không lỗi JavaScript. Kiểm tra tương tác không ghi request API.

Kết quả trực tiếp trên Vercel: [tương tác](qa/vercel/functional-results.json), [desktop/mobile](qa/vercel/preview-results.json). Các ảnh nằm cùng thư mục.

## Giới hạn của bản xem trước

Dữ liệu giả, thao tác thêm/sửa chỉ giữ trong phiên và mất khi tải lại. Chưa kết nối API hoặc database thật. Adapter GET đã chuẩn bị; xác nhận DTO, đăng nhập, quyền và URL API là bước tích hợp sau.

Danh sách hợp đồng chỉ đọc, dùng lại renderer chi tiết hiện có; liên kết mở module đơn thuê xe đang chạy. Không triển khai luồng tạo đơn, nhận cọc, giao xe, gia hạn, trả xe, thanh toán hoặc tất toán.

Repo gốc giữ remote `https://github.com/huybitvvt/duanthuexe.git`; không đẩy thay đổi lên repo đó. Không sửa module đơn thuê xe, API hoặc database của repo gốc.
