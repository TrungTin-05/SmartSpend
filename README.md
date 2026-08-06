# SmartSpend – Demo Sprint 1

Demo giao diện (~25-30%) cho báo cáo giữa kỳ: Splash → Login → Register → Dashboard,
các mục Thu nhập / Chi tiêu / Hồ sơ hiển thị "Coming Soon" (chưa nối API thật).

## Cách chạy (mở project này trong VS Code)

1. Cài Node.js (bản LTS) nếu máy chưa có: https://nodejs.org
2. Mở thư mục `smartspend-demo` trong VS Code.
3. Mở Terminal trong VS Code (`Ctrl + ~`) và chạy:
   ```
   npm install
   npm run dev
   ```
4. Mở trình duyệt tại địa chỉ hiện ra trong terminal (thường là `http://localhost:5173`).

## Cấu trúc project

```
smartspend-demo/
  src/
    pages/
      Splash.jsx      → màn hình chờ, tự chuyển sang Login sau ~2s
      Login.jsx        → đăng nhập (demo, chưa nối API)
      Register.jsx      → đăng ký (demo, chưa nối API)
      Dashboard.jsx     → trang chủ, số dư, giao dịch gần đây (dữ liệu mẫu)
      ComingSoon.jsx    → dùng chung cho Thu nhập / Chi tiêu / Hồ sơ
    components/
      BottomNav.jsx     → thanh điều hướng dưới cùng
    App.jsx             → khai báo route
    main.jsx            → điểm khởi chạy React
```

## Việc cần làm tiếp (Sprint 2 trở đi)

- Nối API thật với Backend Node.js/Express + JWT (login/register).
- Kết nối MongoDB để lưu giao dịch thật thay vì dữ liệu mẫu trong `Dashboard.jsx`.
- Xây màn hình Thêm giao dịch, Quản lý danh mục thay cho "Coming Soon".

## Lưu ý khi chụp ảnh demo cho báo cáo Word

Chạy `npm run dev`, mở từng màn hình (Splash/Login/Register/Dashboard/Coming Soon)
rồi chụp màn hình để chèn vào Chương 7 của báo cáo Word Sprint 1.
