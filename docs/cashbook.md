# Sổ quỹ / Sổ két

Màn `/cashbook` nằm trong menu quản lý, hiển thị đồng thời **Phiếu thu** và **Phiếu chi**. Hai bảng dùng chung `CashbookTable` và `CASHBOOK_COLUMNS`, theo đúng thứ tự:

| Cột | Ý nghĩa |
| --- | --- |
| ID | Mã định danh phiếu, giữ nguyên ID nguồn |
| Ngày | Ngày tạo/phát sinh, hiển thị dd/mm/yyyy |
| Giờ | Thời gian cụ thể; giữ giây khi nguồn cung cấp |
| Loại phiếu | Phiếu thu / Phiếu chi |
| Người thực hiện | Người tạo/thực hiện phiếu |
| Lý do | Lý do thu/chi |
| Nội dung | Chi tiết giao dịch/phiếu |

Tìm kiếm không dấu theo ID, người thực hiện, lý do, nội dung áp dụng cho cả hai bảng. Có bộ lọc người thực hiện bằng ID, ngày từ/đến bao gồm cả hai đầu và cơ sở dùng dropdown chung của hệ thống. Mỗi bảng có sắp xếp, số dòng 5/10/20/50 và trang độc lập. CSV xuất cả hai nhóm theo bộ lọc, cùng bảy cột và có escape công thức spreadsheet. Ngày ngược báo lỗi và khóa xuất.

Hai bảng được xếp dọc, giữ đủ cột ở mọi kích thước. Trên màn nhỏ, cuộn ngang trong vùng bảng để xem nội dung; có hướng dẫn hiển thị, vùng cuộn focus được và nhãn cho sắp xếp/phân trang. Phiếu thu/chi phân biệt bằng chữ và màu xanh/đỏ. Số đếm là số phiếu theo bộ lọc, không phải số tiền hay số dư.

## Dữ liệu và adapter

Vercel mặc định demo: 48 phiếu minh họa, gồm 24 thu và 24 chi, người thực hiện/cơ sở từ fixture quản lý. Các phiếu này độc lập với hành động hợp đồng, không tạo giao dịch, tính số dư hoặc ghi database. Không thêm thao tác tạo/sửa/xóa phiếu trong phạm vi giao diện danh sách này.

`CashbookRepository.load(signal)` tách adapter demo và API. Khi bật `NEXT_PUBLIC_MANAGEMENT_DATA_SOURCE=api`, dùng `NEXT_PUBLIC_API_URL` như các danh mục khác (mặc định `/api`), gọi **GET `/api/auth/transactions?page=N&limit=100`**. Endpoint và cấu trúc `{ status: 'success', data: { data, total, last_page } }` đã đọc từ `apps/api/src/modules/finance/finance.controller.ts` và `finance.service.ts` của repo gốc. Adapter không gọi API ghi tài chính/đơn thuê xe.

Mapping: `id`; `created_at` hoặc `occurred_at` tách ngày/giờ; `type=in/addon` thành thu, `out` thành chi; `user_name`/`user.name` là người thực hiện và `created_by`/`user_id` là ID; `reason` là lý do; `content` hoặc `note` là nội dung; `store_id` dùng lọc cơ sở. Không dùng người nộp/nhận tiền thay cho người tạo phiếu.

Trường thiếu giữ là thiếu và hiển thị **—**. Đặc biệt source Nest đang có `note`, chưa xác minh trường `reason` riêng, nên không tự suy diễn lý do từ nội dung. Timestamp có timezone đổi sang Asia/Ho_Chi_Minh; timestamp không timezone giữ giá trị server trả về, ngày không có giờ không tự gán 00:00. Cần xác nhận timezone và DTO trước khi bật dữ liệu vận hành.

Adapter tải đủ các trang, kiểm tra tổng, ID trùng, cấu trúc và loại giao dịch; gặp loại chưa được xác nhận sẽ báo lỗi, không âm thầm bỏ phiếu. Lỗi quyền/mạng/API không được fallback thành fixture. Giới hạn 1.000 trang; dataset lớn cần nối lọc/phân trang server. API vận hành thật chưa được kết nối/xác minh trong bản demo này. Module tài chính cũ, API Nest và database không đổi.

## Kiểm tra

```powershell
npm.cmd run test:cashbook
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
python scripts/check-cashbook-ui.py --url http://localhost:3001
```

Script browser cần Python Playwright/Chromium. Sáu nhóm dữ liệu/adapter và bảy nhóm tương tác đạt: cột giống nhau, phân loại đúng, thời gian/thiếu dữ liệu, bộ lọc kết hợp, CSV, phân trang độc lập, tải/lỗi/thử lại, điều hướng và 375/768/1024px. Tám nhóm danh mục và tám nhóm sao chép/khách hàng hồi quy đạt, không có lỗi JavaScript hoặc request ghi API.

Xem [kết quả tương tác](qa/cashbook/functional-results.json), [desktop](qa/cashbook/cashbook-1440.png), [mobile](qa/cashbook/cashbook-375.png).
