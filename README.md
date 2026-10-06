# HIMOTO Management

Frontend Next.js + TypeScript cho năm màn dạng bảng: Nhân sự, Khách hàng, Hợp đồng (chỉ đọc), Cơ sở, Danh sách xe.

Demo: **https://himoto-management.vercel.app**. Repo private: https://github.com/huybitvvt/himoto-management. Vercel đã kết nối repo, nhánh `main`.

```bash
npm ci
npm run dev
npm run typecheck
npm run lint:management
npm run test:management
npm run build
```

Mở http://localhost:3000. Mặc định dùng dữ liệu mẫu; thêm/sửa chỉ giữ trong phiên xem trước, không ghi database. Không có backend hay secret trong repo này. Backend dự kiến NestJS, giữ database hiện có.

Module đơn thuê xe không được xây dựng lại. Liên kết mở ứng dụng hiện có qua `NEXT_PUBLIC_RENTAL_APP_URL`. Component đọc chi tiết của module cũ được dùng lại.

Cấu hình Vercel đã có trong `vercel.json`, chạy `vercel --prod`. Bản công khai chỉ dùng dữ liệu mẫu. API thật cần tích hợp và xác minh DTO trước khi bật. Xem [ghi chú triển khai và API](docs/implementation.md), [ảnh giao diện](docs/qa).

Kiểm tra browser (cần Python Playwright và Chromium): `python scripts/check-management-ui.py --output docs/qa`, `python scripts/preview-management-ui.py --output docs/qa`.

Đã kiểm tra bản production: build, TypeScript, lint, 8 kiểm tra dữ liệu/adapter, 8 nhóm tương tác, 5 màn ở desktop 1440px và mobile 375px. Không phát hiện lỗi JavaScript hoặc request ghi API trong các ca đã chạy.

![Danh sách xe trên Vercel](docs/qa/vercel/vehicles-1440.png)
