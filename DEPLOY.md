# Deploy lên Vercel + Turso

Bản deploy dùng **Turso** (SQLite trên cloud) thay cho file `prisma/dev.db`, và bật **đăng nhập bằng mật khẩu** để người lạ không dùng được web. Chạy local không cần làm gì trong file này: thiếu các biến dưới đây thì web vẫn dùng file SQLite và không hỏi mật khẩu.

| Biến môi trường | Bắt buộc | Dùng để |
|---|---|---|
| `TURSO_DATABASE_URL` | có | Địa chỉ DB Turso (`libsql://…`). Có biến này thì web dùng Turso. |
| `TURSO_AUTH_TOKEN` | có | Token truy cập DB Turso. |
| `APP_PASSWORD` | có | Mật khẩu đăng nhập web. Có biến này thì mọi trang, API, server action đều cần đăng nhập. |
| `AUTH_SECRET` | có | Chuỗi ngẫu nhiên ≥ 32 ký tự để ký cookie đăng nhập. Đổi chuỗi này = đăng xuất mọi thiết bị. |
| `APP_TIMEZONE` | không | Múi giờ tính "hôm nay", chuỗi ngày học, lịch ôn. Mặc định `Asia/Ho_Chi_Minh` (máy chủ Vercel chạy giờ UTC). |

Không commit các giá trị này lên Git; chỉ nhập vào Vercel (và `.env` trên máy khi chạy script ở bước 2).

Tạo `AUTH_SECRET`:

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## 0. Chuẩn bị

- Commit và push mọi thay đổi lên GitHub (`origin` = `github.com/vkhanh2802/HSK-Learning_Web`). Vercel build từ code trên GitHub, không phải từ máy bạn.
- Chọn **cùng một khu vực** cho Turso và Vercel, ví dụ Singapore — mỗi trang gọi DB nhiều lần, DB ở xa sẽ làm trang chậm.

## 1. Tạo DB Turso

1. Tạo tài khoản tại turso.tech. Cài Turso CLI theo hướng dẫn trên trang của họ (Windows: dùng WSL), rồi đăng nhập: `turso auth login`.
2. Tạo DB ở khu vực gần (ví dụ Singapore — xem danh sách bằng `turso db locations`), lấy địa chỉ và token:

   ```
   turso db create web-chinese --location <mã-khu-vực>
   turso db show web-chinese --url
   turso db tokens create web-chinese
   ```

   Không dùng CLI cũng được: tạo DB và token ngay trên trang quản lý của Turso.

## 2. Tạo bảng và nạp dữ liệu bài học vào Turso (chạy trên máy)

Thêm tạm vào `.env`:

```
TURSO_DATABASE_URL="libsql://…"
TURSO_AUTH_TOKEN="…"
```

rồi chạy:

```
npx tsx scripts/turso-migrate.ts
npx tsx prisma/seed.ts
```

- `turso-migrate.ts` áp các migration trong `prisma/migrations` (chạy lại an toàn — migration đã áp sẽ bỏ qua). Sau này có migration mới thì chạy lại lệnh này **trước** khi deploy bản mới.
- Seed qua mạng mất vài phút; chạy lại an toàn. Lần nào sửa dữ liệu trong `data/` thì chạy lại seed.
- Xong thì **xoá hai dòng Turso khỏi `.env`**, nếu không web chạy local cũng sẽ dùng Turso.

## 3. Deploy lên Vercel

1. vercel.com → đăng nhập bằng GitHub → **Add New → Project** → chọn repo `HSK-Learning_Web` → **Import**.
2. Framework: Next.js (tự nhận). Build command để mặc định (`npm run build` — đã gồm `prisma generate`).
3. Mở **Environment Variables**, thêm 4 biến bắt buộc ở bảng trên (cho môi trường Production).
4. Bấm **Deploy**, chờ build xong.
5. Sau khi tạo project, vào **Settings**:
   - **Functions → Function Region**: chọn cùng khu vực với DB Turso, rồi **Redeploy**.
   - **Build & Deployment → Node.js Version**: `24.x` (dự án yêu cầu Node 24 hoặc ≥ 26).
6. Mở địa chỉ Vercel cấp (`https://<tên>.vercel.app`) → trang đăng nhập → nhập `APP_PASSWORD`.

Mỗi lần push lên `master`, Vercel tự deploy lại.

## 4. Chuyển tiến độ học từ máy lên (tuỳ chọn)

1. Chạy web local → **Thống kê** → **Tải file backup**.
2. Trên web đã deploy (đã đăng nhập) → **Thống kê** → **Khôi phục từ file…** → chọn file vừa tải. Thao tác này ghi đè toàn bộ tiến độ trên bản deploy.

Vercel giới hạn mỗi lần gửi lên tối đa **4,5 MB**. File backup lớn hơn mức đó (khoảng hơn 15.000 lượt làm bài) sẽ bị từ chối — nên chuyển tiến độ sớm, khi file còn nhỏ.

## 5. Cài như ứng dụng (PWA)

- Chrome/Edge trên máy tính: biểu tượng **Cài đặt** ở thanh địa chỉ.
- Android (Chrome): menu ⋮ → **Thêm vào màn hình chính**.
- iPhone (Safari): nút Chia sẻ → **Thêm vào MH chính**.

Sau khi mở web có mạng ít nhất một lần, trang **Học → Ôn offline** dùng được khi mất mạng (ôn thẻ từ bộ từ đã lưu; kết quả ôn offline không cập nhật lịch ôn). Trang đã từng mở cũng xem lại được khi mất mạng.

## Kiểm tra sau khi deploy

- Mở trang trong cửa sổ ẩn danh → phải bị chuyển sang trang đăng nhập.
- Đăng nhập → Trang chủ, Học HSK1, một bài học, Ôn tập, Thi thử, Thống kê đều mở được.
- Nếu trang báo lỗi: Vercel → project → **Logs** để xem lỗi (thường do thiếu/sai biến môi trường hoặc chưa chạy bước 2).

## Lưu ý bảo mật

- Dùng mật khẩu dài, khó đoán: web chỉ làm chậm mỗi lần nhập sai (0,8 giây), không khoá tài khoản.
- Đăng nhập được kiểm tra hai lớp: `src/proxy.ts` chặn mọi request, và từng server action / API tự kiểm tra lại session (`src/lib/session.ts`).
- Service worker lưu bản sao các trang đã mở trong trình duyệt để xem offline. Đừng đăng nhập trên máy dùng chung.
- Nếu sau này mở khoá chấm bằng AI (Phase 9.2), key AI chỉ đặt trong biến môi trường của Vercel; đăng nhập ở trên giúp người lạ không tiêu tốn key của bạn.
