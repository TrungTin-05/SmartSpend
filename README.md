# SmartSpend Demo

Dự án web quản lý chi tiêu cá nhân với giao diện React + backend Express + SQL Server.

## Mục tiêu

- Quản lý tài chính cá nhân
- Đăng nhập / đăng ký người dùng
- Quản lý ví, giao dịch, ngân sách, báo cáo
- Giao diện React chạy trên port 5173, backend chạy trên port 5000

## Yêu cầu trước khi chạy

1. Cài đặt Node.js LTS: https://nodejs.org/
2. Cài đặt SQL Server trên máy hoặc có sẵn SQL Server local
3. Cài đặt Git Bash / PowerShell / VS Code terminal
4. Kiểm tra file [server/.env](server/.env) để đảm bảo cấu hình database đúng với máy bạn

## Cấu trúc thư mục

```bash
smartspend-demo/
├─ package.json               # frontend React + Vite
├─ src/                      # source code frontend
├─ server/
│  ├─ package.json           # backend Node.js/Express
│  ├─ server.js              # khởi chạy server
│  ├─ .env                  # cấu hình DB và JWT
│  ├─ config/
│  ├─ models/
│  ├─ routes/
│  └─ migrations/
├─ README.md
└─ index.html
```

## Bước 1: Cài đặt dependencies

Mở terminal tại thư mục gốc của project:

```bash
cd smartspend-demo
npm install
```

Sau đó cài đặt backend:

```bash
cd server
npm install
```

## Bước 2: Cấu hình database

File [server/.env](server/.env) đang chứa cấu hình mẫu:

```env
DB_HOST=TRUNTIN\MSSQLSERVER1
DB_INSTANCE=
DB_PORT=
DB_NAME=smartspend
DB_AUTH_TYPE=sql
DB_USER=sa
DB_PASSWORD=123456
JWT_SECRET=smartspend-secret
FRONTEND_ORIGIN=http://localhost:5173
```

Nếu máy bạn dùng SQL Server khác, hãy sửa lại các giá trị này:

- DB_HOST: tên máy hoặc hostname SQL Server
- DB_NAME: tên database
- DB_USER / DB_PASSWORD: tài khoản SQL Server
- JWT_SECRET: secret key cho JWT

Lưu ý: database `smartspend` phải tồn tại hoặc sẽ được ứng dụng tạo tự động nếu cấu hình đúng.

## Bước 3: Khởi động backend

Từ thư mục `server`:

```bash
cd smartspend-demo/server
npm run dev
```

Hoặc chạy production mode:

```bash
npm start
```

Backend sẽ khởi chạy ở:

```text
http://localhost:5000
```

Nếu kết nối SQL Server thành công, server sẽ tự động sync model và tạo schema cần thiết.

## Bước 4: Khởi động frontend

Mở một terminal mới, ở thư mục gốc:

```bash
cd smartspend-demo
npm run dev
```

Frontend sẽ mở ở địa chỉ thường là:

```text
http://localhost:5173
```

## Bước 5: Truy cập ứng dụng

Mở browser và vào:

```text
http://localhost:5173
```

## Build production

Để build phiên bản production của frontend:

```bash
cd smartspend-demo
npm run build
```

Sau đó có thể preview:

```bash
npm run preview
```

## Troubleshooting

### 1) Lỗi kết nối SQL Server

- Kiểm tra SQL Server đang chạy
- Kiểm tra `server/.env`
- Đảm bảo user/password đúng
- Nếu dùng SQL Server instance, kiểm tra `DB_HOST` và `DB_INSTANCE`

### 2) Lỗi CORS

Backend đã cấu hình `FRONTEND_ORIGIN=http://localhost:5173`. Nếu frontend chạy ở port khác, hãy cập nhật biến `FRONTEND_ORIGIN` trong [server/.env](server/.env).

### 3) Lỗi package chưa cài đặt

Chạy lại:

```bash
npm install
cd server
npm install
```

## Ghi chú

- Frontend đang chạy bằng Vite
- Backend đang chạy bằng Express + Sequelize + SQL Server
- Mỗi khi chạy lại backend, ứng dụng sẽ tự kết nối tới DB và đồng bộ model

## Tác giả

SmartSpend Demo
