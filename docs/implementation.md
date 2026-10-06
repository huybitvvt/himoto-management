# HIMOTO — năm màn quản lý dạng bảng

Phạm vi: Next.js frontend cho `/staff`, `/customers`, `/contracts`, `/stores`, `/vehicles`. Trang `/` dẫn đến danh sách xe. Mỗi danh sách dùng cùng component bảng, tìm kiếm không dấu, bộ lọc, sắp xếp, phân trang 10/20/50 dòng, ẩn/hiện cột và xuất CSV thật theo kết quả đã lọc.

Module đơn thuê xe, API NestJS và database không được sửa. Hợp đồng không có form tạo/sửa, thu tiền, giao xe, gia hạn, trả xe hoặc tất toán. Component `RentalDetailModal` hiện có được dùng lại để đọc chi tiết; nút in của component được ẩn trong phạm vi giao diện quản lý. Module cũ chưa hỗ trợ deep link tới một đơn cụ thể, nên liên kết mở danh sách đơn thuê xe hiện có.

## Chạy và kiểm tra

```powershell
cd E:\himoto-management
npm.cmd ci
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run lint:management
npm.cmd run test:management
npm.cmd run build
```

Kiểm tra bằng trình duyệt từ thư mục dự án:

```powershell
python scripts/check-management-ui.py --output docs/qa
python scripts/preview-management-ui.py --output docs/qa
```

Hai script dùng Python Playwright và Chromium (`pip install playwright` và `python -m playwright install chromium`). Ảnh và kết quả nằm trong `docs/qa/`. Bản standalone đã qua TypeScript, lint, 8 kiểm tra dữ liệu/adapter, 8 nhóm kiểm tra tương tác trên bản production và chụp 10 ảnh ở desktop 1440px/mobile 375px. Không phát hiện lỗi JavaScript trình duyệt hoặc request ghi API trong các ca đã chạy.

## Dữ liệu và khả năng kết nối

- Mặc định là demo: danh tính, giấy tờ, liên hệ, địa chỉ và biển số được tạo giả; email dùng miền `example.test`. Dữ liệu không lưu vào database hoặc localStorage. Thêm/sửa được giữ khi chuyển giữa năm màn, mất khi tải lại trang. Menu người dùng có khôi phục dữ liệu mẫu.
- Provider nhận `ManagementRepository`; adapter demo và adapter HTTP tách biệt. Không fallback sang mẫu nếu API lỗi. API hiện chỉ đọc; các form được ẩn khi bật nguồn API.
- Bật HTTP bằng `NEXT_PUBLIC_MANAGEMENT_DATA_SOURCE=api`; URL gốc dùng `NEXT_PUBLIC_API_URL`, mặc định `/api`. Cần phiên đăng nhập hợp lệ. API chưa được kiểm bằng dữ liệu vận hành thật.
- Adapter đọc các trang API tới khi đủ dữ liệu trước khi lọc phía client. Giới hạn 1.000 trang; cần chuyển lọc/sắp xếp/phân trang sang server trước khi dùng dataset lớn.
- `NEXT_PUBLIC_RENTAL_APP_URL` xác định nơi mở module đơn thuê xe. Ở repo gốc mặc định `/car-rental`; bản frontend độc lập trỏ tới ứng dụng đang chạy.
- Giấy tờ, mã, trạng thái và số tiền thiếu từ API được giữ là thiếu và hiển thị `—`; không biến thành số 0. Nếu API chưa cung cấp đủ số tiền, thao tác xem hợp đồng mở module hiện có.
- Lọc cơ sở ở khách hàng dựa trên `customer_id` của hợp đồng tại cơ sở đó, không suy diễn từ ID khách hàng. Không có quan hệ hợp đồng thì khách hàng không xuất hiện khi lọc cơ sở.

## Các GET đã xác minh trong source NestJS

| Màn | Endpoint tương đối với `/api` | Những trường cần xác nhận trước khi dùng thật |
| --- | --- | --- |
| Nhân sự | `/auth/hr/staff` | API đang đọc users; cần chốt liên kết staff_profiles, staff_code, position và quyền ghi |
| Khách hàng | `/auth/customers` | Số hợp đồng tổng hợp, cảnh báo, hồ sơ nháp và quyền xem giấy tờ |
| Cơ sở | `/auth/stores` | Người phụ trách, số xe/nhân sự; PHP dùng store_phone/store_address, Nest đang dùng phone/address |
| Xe | `/auth/vehicle/vehicles` | Giá theo ngày/tháng, loại xe và current_store_id so với store_id |
| Hợp đồng | `/auth/order/car-rental` | Mã, trường cọc, snapshot khách/xe, loại hợp đồng và trạng thái |

View xe giữ các mã PHP: `ready`, `using`, `repairing`, `pending`, `sold`, `bad_debt`, `broken`, `in_transit`. Alias Nest `rent`, `maintenance`, `holding` chỉ được ánh xạ ở frontend; không cập nhật DB. `electric` và loại tour trong fixture là giá trị minh họa cần xác nhận. Các mã hợp đồng số được hiển thị theo `ORDER_STATUS` của module cũ, giữ nguyên mã gốc.

Không tự lấy `price_range` làm đơn giá, hoặc `pid` làm cọc. Không gộp nghiệp vụ thuê sở hữu vào hợp đồng thuê xe khi chưa thống nhất DTO. Không có POST/PUT/DELETE trong adapter HTTP của bản giao diện này.

## Repo và triển khai mới

Bản standalone chỉ mang năm màn, các component quản lý, fixture, adapter và component đọc chi tiết đã có. Không mang backend, database, module xử lý đơn thuê xe, secret hoặc lịch sử Git cũ. Module đơn thuê xe được mở bằng liên kết sang ứng dụng hiện có.

Repo standalone nằm tại `E:\himoto-management`, được tách từ workspace gốc bằng script export ở repo gốc. Repo gốc giữ nguyên origin và các module nghiệp vụ. Cấu hình Vercel mặc định nguồn demo; bật API thật là bước tích hợp riêng.
