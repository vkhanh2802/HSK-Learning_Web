# Deploy lên Vercel + Turso

Bản deploy dùng **Turso** (SQLite trên cloud) thay cho file `prisma/dev.db`, và bật **đăng nhập bằng mật khẩu** để người lạ không dùng được web. Chạy local không cần làm gì trong file này: thiếu các biến dưới đây thì web vẫn dùng file SQLite và không hỏi mật khẩu.

| Biến môi trường | Dùng để |
|---|---|
| `TURSO_DATABASE_URL` | Địa chỉ DB Turso (`libsql://…`). Có biến này thì web dùng Turso. |
| `TURSO_AUTH_TOKEN` | Token truy cập DB Turso. |
| `APP_PASSWORD` | Mật khẩu đăng nhập web. Có biến này thì mọi trang, API, server action đều cần đăng nhập. |
| `AUTH_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự để ký cookie đăng nhập. Đổi chuỗi này = đăng xuất mọi thiết bị. |

Không commit các giá trị này lên Git; chỉ nhập vào Vercel (và `.env` trên máy nếu cần chạy script).

## 1. Tạo DB Turso

1. Tạo tài khoản tại turso.tech, cài Turso CLI theo hướng dẫn của họ, rồi đăng nhập: `turso auth login`.
2. Tạo DB và lấy địa chỉ, token:

   ```
   turso db create web-chinese
   turso db show web-chinese --url
   turso db tokens create web-chinese
   ```

## 2. Tạo bảng và nạp dữ liệu bài học vào Turso

Trên máy, thêm tạm `TURSO_DATABASE_URL` và `TURSO_AUTH_TOKEN` vào `.env` (hoặc đặt biến môi trường trong terminal), rồi chạy:

```
npx tsx scripts/turso-migrate.ts
npx tsx prisma/seed.ts
```

- `turso-migrate.ts` áp các migration trong `prisma/migrations` (chạy lại an toàn). Mỗi lần có migration mới thì chạy lại lệnh này trước khi deploy bản mới.
- Seed qua mạng chạy vài phút (hàng nghìn câu lệnh). Chạy lại an toàn.
- Xong thì **xoá hai biến Turso khỏi `.env`**, nếu không thì web chạy local cũng sẽ dùng Turso.

## 3. Chuyển tiến độ học từ máy lên (tuỳ chọn)

1. Chạy web local như bình thường → trang **Thống kê** → **Tải file backup**.
2. Sau khi deploy xong (bước 4), đăng nhập web đã deploy → **Thống kê** → **Khôi phục từ file…** và chọn file vừa tải.

## 4. Deploy lên Vercel

1. Đẩy code lên GitHub (repo private nếu không muốn công khai nội dung).
2. Trên vercel.com: **Add New → Project**, chọn repo. Framework tự nhận Next.js; giữ build command mặc định (`npm run build` — đã gồm `prisma generate`).
3. Mục **Environment Variables**: thêm 4 biến ở bảng trên.
4. **Deploy**. Mở địa chỉ Vercel cấp → trang đăng nhập → nhập `APP_PASSWORD`.

## 5. Cài như ứng dụng (PWA)

- Chrome/Edge trên máy tính: biểu tượng **Cài đặt** ở thanh địa chỉ.
- Android (Chrome): menu ⋮ → **Thêm vào màn hình chính**.
- iPhone (Safari): nút Chia sẻ → **Thêm vào MH chính**.

Sau khi mở web có mạng ít nhất một lần, trang **Học → Ôn offline** dùng được khi mất mạng (ôn thẻ từ bộ từ đã lưu; kết quả ôn offline không cập nhật lịch ôn). Trang đã từng mở cũng xem lại được khi mất mạng.

## Lưu ý bảo mật

- Dùng mật khẩu dài, khó đoán: web chỉ làm chậm mỗi lần nhập sai, không khoá tài khoản.
- Nếu sau này mở khoá chấm bằng AI (Phase 9.2), key AI chỉ đặt trong biến môi trường của Vercel; đăng nhập ở trên giúp người lạ không tiêu tốn key của bạn.
