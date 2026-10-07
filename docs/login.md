# Đăng nhập và mục Log

- `/` mở `/login`, dùng lại ảnh `himoto-journey.webp` từ web HIMOTO cũ. Form có email, mật khẩu, hiện/ẩn mật khẩu, thông báo lỗi và trạng thái đang đăng nhập.
- **Log** là tên mục và tiêu đề của `/contracts/drafts`. Nút thao tác và trạng thái vẫn là **Lưu nháp**. Dữ liệu nháp và địa chỉ trang được giữ nguyên.
- Bản public/demo có nút **Xem bản demo**, không nhận thông tin đăng nhập thật. Từ menu người dùng có thể quay về **Màn đăng nhập**.
- Local Supabase dùng tài khoản quản trị đang hoạt động trong `himoto.users` và bcrypt hiện có. Chưa triển khai phân quyền theo cơ sở nên tài khoản khác bị từ chối. Không tạo tài khoản hoặc thay đổi mật khẩu/schema.
- Cookie phiên được ký phía server, HttpOnly, SameSite=Strict, thời hạn tám giờ; dùng Secure khi chạy HTTPS. API đọc/ghi đều kiểm tra phiên và quyền hiện tại. API ghi yêu cầu cùng origin. Có nút **Đăng xuất**.
- API database vẫn bị tắt trên production. Khóa phiên local nằm trong `.env.local`; không có khóa thì server tạo khóa trong bộ nhớ.

Kiểm tra:

```powershell
npm.cmd run test:login
python scripts/check-management-login-ui.py --source demo --url http://127.0.0.1:3001
```

Browser API kiểm tra dữ liệu thật bằng cookie QA tạm qua `--session-cookie-file`; không gửi mật khẩu thật hay sửa dữ liệu nghiệp vụ. Ca thành công với bcrypt được kiểm tra bằng tài khoản giả trong unit test; chưa kiểm tra đăng nhập bằng mật khẩu tài khoản vận hành.
