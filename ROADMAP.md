# Web học tiếng Trung HSK1 → HSK4 — Outline thực hiện từng bước

> Mục tiêu: web cá nhân học đủ 4 kỹ năng Nghe – Nói – Đọc – Viết, từ pinyin cơ bản đến HSK4.
> Cách dùng file này: làm lần lượt từng Phase. Mỗi bước có checklist `[ ]` — tick `[x]` khi xong. Chỉ sang Phase mới khi đạt "Tiêu chí hoàn thành" của Phase hiện tại.

---

## Mục lục

- [0. Quyết định ban đầu](#0-quyết-định-ban-đầu)
- [Phase 1 — Khởi tạo dự án](#phase-1--khởi-tạo-dự-án)
- [Phase 2 — Dữ liệu & Database](#phase-2--dữ-liệu--database)
- [Phase 3 — MVP: Bài học từ vựng + Ôn tập SRS](#phase-3--mvp-bài-học-từ-vựng--ôn-tập-srs)
- [Phase 4 — Nền tảng: Pinyin, Thanh điệu, Nét chữ](#phase-4--nền-tảng-pinyin-thanh-điệu-nét-chữ)
- [Phase 5 — Kỹ năng Nghe](#phase-5--kỹ-năng-nghe-听)
- [Phase 6 — Kỹ năng Đọc](#phase-6--kỹ-năng-đọc-读)
- [Phase 7 — Ngữ pháp](#phase-7--ngữ-pháp)
- [Phase 8 — Kỹ năng Nói](#phase-8--kỹ-năng-nói-说)
- [Phase 9 — Kỹ năng Viết](#phase-9--kỹ-năng-viết-写)
- [Phase 10 — Mở rộng HSK3–4](#phase-10--mở-rộng-hsk34)
- [Phase 11 — Thi thử HSK](#phase-11--thi-thử-hsk)
- [Phase 12 — Dashboard & Thống kê](#phase-12--dashboard--thống-kê)
- [Phase 13 — Deploy & PWA (tùy chọn)](#phase-13--deploy--pwa-tùy-chọn)
- [Phụ lục A — Schema Prisma đầy đủ](#phụ-lục-a--schema-prisma-đầy-đủ)
- [Phụ lục B — Định dạng dữ liệu JSON](#phụ-lục-b--định-dạng-dữ-liệu-json)
- [Phụ lục C — Cấu trúc đề HSK1–4](#phụ-lục-c--cấu-trúc-đề-hsk14)
- [Phụ lục D — Rủi ro & lưu ý](#phụ-lục-d--rủi-ro--lưu-ý)

---

## 0. Quyết định ban đầu

Chốt trước khi code (mặc định đã chọn ở cột phải — đổi nếu muốn):

| Câu hỏi | Mặc định |
|---|---|
| Chuẩn HSK | **HSK 2.0** (150 / 300 / 600 / 1200 từ cộng dồn) |
| Người dùng | 1 người (bạn), chưa cần đăng nhập |
| Stack | Next.js 16 (App Router) + TypeScript + Tailwind + Prisma + SQLite |
| Chạy ở đâu | Local trước, deploy sau (Phase 13) |
| Ngôn ngữ giao diện | Tiếng Việt |

Yêu cầu máy: Node.js 24.x hoặc ≥ 26, Git, Chrome (để dùng nhận diện giọng nói).

---

## Phase 1 — Khởi tạo dự án

### 1.1 Tạo project
- [x] Tạo scaffold bằng `npx create-next-app@15.5.29 <thư-mục-tạm>/web_chinese --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --yes`, rồi sao chép vào project, giữ nguyên ROADMAP.
- [x] Theo yêu cầu người dùng, nâng scaffold hiện có lên Next.js 16.4.6, React/React DOM 19.3.1 và ESLint config 16.4.6; giữ nguyên trang mẫu, chưa làm 1.2–1.4.
- [x] `git init`
- [x] Commit đầu tiên — người dùng đã phê duyệt; commit `chore: initialize Next.js 16 project` ghi nhận scaffold của mục 1.1.
- [x] Tạo `.gitignore` có `node_modules`, `.env` và biến thể (ngoại trừ `.env.example`), `prisma/dev.db` và SQLite sidecar, `.next`.

> Lịch sử khởi tạo: Next.js 15.5.29 đã đạt `npm ci`, lint, TypeScript, build và dev HTTP smoke; audit khi đó còn 2 cảnh báo PostCSS (1 moderate, 1 high). Sau đó người dùng đồng ý nâng lên Next.js 16; không dùng `npm audit fix --force`.

> Xác minh sau nâng cấp: Node 24.19.0, npm 11.17.0, Git 2.53.0; Next.js và eslint-config-next 16.4.6 (bản stable mới nhất trên registry npm khi nâng cấp), React/React DOM 19.3.1, @types/react và @types/react-dom 19.3.0. `npm install`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm ls --depth=0` đạt; `npm audit --json` báo 0 lỗ hổng. Dev server trả HTTP 200 cho `/` và `/next.svg`, đã dừng sau kiểm tra. Next.js tự sinh `AGENTS.md` hướng dẫn đọc tài liệu đúng phiên bản. Tại thời điểm xác minh mục 1.1, chưa thực hiện 1.2–1.4; commit khởi tạo sau đó được người dùng phê duyệt.

### 1.2 Cài thư viện
- [x] `npm i --save-exact @prisma/client@7.10.1 ts-fsrs@6.0.0 hanzi-writer@3.7.3 zod@4.6.7 dotenv@18.0.10`
- [x] `npm i -D --save-exact prisma@7.10.1 tsx@4.23.15 vitest@5.1.1` — Prisma CLI nằm trong devDependencies, cùng phiên bản với client.
- [x] `npx prisma init --datasource-provider sqlite --no-skills`
- [x] Thêm `.env.example` chỉ có `DATABASE_URL="file:./dev.db"`; `.env` thực tế đã được ignore.
- [x] Xử lý GHSA-7589-6fvf-x4pw trước commit: override riêng `@prisma/config@7.10.1 -> effect@3.22.5` (bản vá từ 3.22.1), giữ cặp Prisma/client 7.10.1 và Effect major 3; ghi chú bảo trì trong README.

> Phiên bản/môi trường: chọn Prisma stable 7.10.1 vì nhãn `latest` của CLI đang trỏ tới 8.0.0-rc.34. Bộ thư viện 1.2 yêu cầu Node 24.x hoặc >= 26 (đã cập nhật engines và README); môi trường kiểm tra là Node 24.19.0, @types/node 24.19.2. CLI bản này sinh `prisma7.config.ts`, nạp URL qua `dotenv`; schema chỉ có SQLite datasource và generator `prisma-client`, output `src/generated/prisma` đã ignore. Phụ lục A dùng cú pháp Prisma cũ: khi làm Phase 2 cần giữ URL trong config, dùng output/import client mới và bổ sung SQLite runtime adapter; chưa cài adapter hay tạo model, database, migration, seed hoặc client ở bước này.

> Xác minh sau bản vá: `npm ci`, `npm ls --depth=0`, `npm ls effect --all` (chỉ còn 3.22.5), `npx prisma validate`, Prisma CLI format trên schema tạm ngoài repo, smoke TypeScript bằng `tsx`, 5 smoke test tạm bằng Vitest (Effect đúng bản vá, Prisma config hợp lệ/không hợp lệ, input advisory 20.000 ký tự trong worker có timeout, export thư viện), `npm run lint`, `npx tsc --noEmit`, `npm run build` đều đạt; test tạm đã xóa, schema project không đổi. Audit ban đầu có 3 high cùng gốc Effect; `npm audit --json` sau bản vá báo 0 lỗ hổng kể cả dev dependencies. Không force-fix, không đổi major. Review tĩnh độc lập cho riêng bản sửa bảo mật đã hoàn tất, không có phát hiện chặn; chưa xác minh client/generate/migrate của Phase 2. Mọi thay đổi 1.2 chưa stage/chưa commit, chỉ chờ người dùng phê duyệt commit.

### 1.3 Cấu trúc thư mục

```
web_chinese/
  data/
    vocab/hsk1.json … hsk4.json
    grammar/hsk1.json …
    passages/hsk1.json …
    lessons/hsk1.json …
  prisma/
    schema.prisma
    seed.ts
  public/audio/                 # mp3 cache (nếu dùng TTS server)
  src/
    app/
      page.tsx                  # Trang chủ = Dashboard
      learn/[levelId]/page.tsx  # Danh sách bài
      lesson/[id]/page.tsx      # Học bài
      review/page.tsx           # Ôn tập SRS
      pinyin/page.tsx
      tones/page.tsx
      write/[char]/page.tsx
      listening/page.tsx
      reading/[id]/page.tsx
      grammar/[id]/page.tsx
      speaking/page.tsx
      writing/page.tsx
      mock-test/[level]/page.tsx
      api/
        review/route.ts
        attempt/route.ts
        grade/route.ts          # gọi LLM (Phase 9)
    components/
      AudioButton.tsx  HanziCard.tsx  StrokeQuiz.tsx
      Recorder.tsx     PinyinToggle.tsx
      exercises/  MultipleChoice.tsx  Dictation.tsx  ReorderSentence.tsx  FillBlank.tsx
    lib/
      db.ts  srs.ts  tts.ts  speech.ts  pinyin.ts  compare.ts
  tests/
```

- [x] Tạo 12 route trang giữ chỗ (`review`, `pinyin`, `tones`, `listening`, `speaking`, `writing`, `learn/[levelId]`, `lesson/[id]`, `write/[char]`, `reading/[id]`, `grammar/[id]`, `mock-test/[level]`) và thay trang mẫu `page.tsx` bằng trang Dashboard giữ chỗ.
- [x] Tạo thư mục rỗng có `.gitkeep`: `data/{vocab,grammar,passages,lessons}`, `public/audio`, `src/components/exercises`, `src/lib`, `tests`.
- [ ] Chưa tạo: `prisma/seed.ts` (Phase 2), các API route, component và file `lib/*` — tạo khi làm tới phase tương ứng.

> Xác minh: `npm run lint`, `npx tsc --noEmit`, `npm run build` đạt; `next start` trả HTTP 200 cho `/`, `/review`, `/pinyin`, `/learn/1`, `/mock-test/4`, `/write/我`. Lưu ý Next.js 16 trả param chữ Hán còn mã hoá nên `write/[char]` tự `decodeURIComponent`; URL mã hoá sai (vd. `%E0%A4%A`) bị chính Next.js trả 500 ở mọi route động, không phải do code trang.

### 1.4 Layout chung
- [ ] Thanh điều hướng: Trang chủ · Học · Ôn tập · Kỹ năng · Ngữ pháp · Thi thử
- [x] Font chữ Hán: `Noto Sans SC` (qua `next/font/google`) — thay Geist; subsets `latin` + `vietnamese`, glyph chữ Hán tải theo unicode-range; `lang="vi"`, đổi title/description.
- [ ] Chế độ sáng/tối

**Tiêu chí hoàn thành:** `npm run dev` chạy, có layout + menu, các trang trống mở được.

---

## Phase 2 — Dữ liệu & Database

### 2.1 Lấy dữ liệu từ vựng
- [ ] Tải danh sách HSK 2.0 từ GitHub `drkameleon/complete-hsk-vocabulary` (hoặc nguồn mở tương đương)
- [ ] Viết script `scripts/build-vocab.ts` chuyển về định dạng ở [Phụ lục B](#phụ-lục-b--định-dạng-dữ-liệu-json)
- [ ] Bổ sung `meaningVi`: dịch bằng LLM **một lần**, lưu vào JSON, **tự duyệt lại** HSK1 trước
- [ ] Bổ sung 1–2 câu ví dụ cho mỗi từ (chỉ dùng từ cùng cấp hoặc thấp hơn)

### 2.2 Chia bài học
- [ ] HSK1: 15 bài × ~10 từ; HSK2: 15 bài × ~10 từ; HSK3: 20 bài × ~15 từ; HSK4: 20 bài × ~30 từ
- [ ] Nhóm theo chủ đề (chào hỏi, số đếm, gia đình, thời gian, mua sắm, …)
- [ ] Lưu trong `data/lessons/hskN.json`

### 2.3 Schema & seed
- [ ] Copy schema ở [Phụ lục A](#phụ-lục-a--schema-prisma-đầy-đủ) vào `prisma/schema.prisma`
- [ ] `npx prisma migrate dev --name init`
- [ ] Viết `prisma/seed.ts`: đọc JSON → upsert Level, Word, Character, Lesson, LessonItem
- [ ] Tách chữ: mỗi `Word` → nhiều `Character` qua `WordCharacter`
- [ ] Thêm vào `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`
- [ ] `npx prisma db seed`
- [ ] `src/lib/db.ts`: singleton PrismaClient

**Tiêu chí hoàn thành:** `npx prisma studio` thấy đủ 150 từ HSK1, 15 bài, chữ đã tách đúng.

---

## Phase 3 — MVP: Bài học từ vựng + Ôn tập SRS

> Xong Phase này là **bắt đầu học được hằng ngày**.

### 3.1 Phát âm (TTS)
- [ ] `src/lib/tts.ts`: dùng `window.speechSynthesis`, chọn voice `zh-CN`, tốc độ chỉnh được
- [ ] `AudioButton.tsx`: nút loa, phát `audioUrl` nếu có, không thì gọi TTS
- [ ] Xử lý trường hợp máy không có voice tiếng Trung → hiện thông báo

### 3.2 Trang học bài `/lesson/[id]`
- [ ] Bước 1 — Giới thiệu từng từ: chữ Hán lớn, pinyin, nghĩa, âm thanh, ví dụ, tách chữ
- [ ] Bước 2 — Kiểm tra nhanh: 5–10 câu trắc nghiệm (Hán → nghĩa, nghe → chọn chữ)
- [ ] Bước 3 — Hoàn thành: tạo `ReviewCard` cho từng từ, đánh dấu bài đã học

### 3.3 Thẻ ôn tập (ReviewCard)
Mỗi từ sinh nhiều thẻ, mỗi thẻ 1 chế độ:

| mode | Hỏi | Đáp | Kỹ năng |
|---|---|---|---|
| `recognize` | 汉字 | nghĩa + pinyin | Đọc |
| `listen` | âm thanh | chọn 汉字 | Nghe |
| `recall` | nghĩa tiếng Việt | gõ pinyin / 汉字 | Viết |
| `write` | nghĩa + pinyin | viết nét (Phase 4) | Viết |

- [ ] MVP chỉ bật `recognize` + `listen`; bật thêm `recall`, `write` sau

### 3.4 Thuật toán FSRS
- [ ] `src/lib/srs.ts`: bọc `ts-fsrs` — `newCard()`, `schedule(card, rating)`, trả về state mới + `due`
- [ ] Rating 4 mức: Again / Hard / Good / Easy
- [ ] Viết test `tests/srs.test.ts`: thẻ mới chấm Good → `due` > hôm nay

### 3.5 Trang ôn tập `/review`
- [ ] Lấy thẻ `due <= now`, giới hạn 100 thẻ/lượt
- [ ] Hiện mặt trước → bấm "Hiện đáp án" → chọn rating
- [ ] `POST /api/review` cập nhật FSRS + ghi `Attempt`
- [ ] Phím tắt: `Space` lật thẻ, `1–4` chấm điểm
- [ ] Cài đặt: số từ mới/ngày (mặc định 10)

### 3.6 Dashboard tối thiểu
- [ ] Số thẻ đến hạn hôm nay, số từ đã học / tổng theo cấp, streak ngày

**Tiêu chí hoàn thành:** học xong bài 1 HSK1, hôm sau mở `/review` có thẻ đến hạn, chấm điểm xong lịch ôn cập nhật đúng.

---

## Phase 4 — Nền tảng: Pinyin, Thanh điệu, Nét chữ

### 4.1 Bảng pinyin `/pinyin`
- [ ] Lưới thanh mẫu × vận mẫu, bấm ô nào phát âm ô đó
- [ ] Ghi chú khó cho người Việt: zh/ch/sh vs z/c/s, j/q/x, ü, -n vs -ng

### 4.2 Luyện thanh điệu `/tones`
- [ ] Bài 1: nghe 1 âm → chọn thanh (1–4, nhẹ)
- [ ] Bài 2: cặp tối thiểu (mā/má/mǎ/mà) → chọn đúng
- [ ] Bài 3: biến điệu (3+3 → 2+3, 不, 一)
- [ ] `src/lib/pinyin.ts`: chuyển `ma3` ↔ `mǎ`, tách thanh khỏi pinyin

### 4.3 Viết chữ `/write/[char]`
- [ ] `StrokeQuiz.tsx` dùng `hanzi-writer`: chế độ xem hoạt ảnh → viết theo mẫu → viết không mẫu
- [ ] Hiển thị bộ thủ, số nét, các từ chứa chữ đó
- [ ] Bật mode `write` cho ReviewCard (chấm: sai ≤1 nét = Good, 2–3 = Hard, >3 = Again)

### 4.4 Bộ thủ
- [ ] Trang 50 bộ thủ thường gặp: hình, nghĩa, ví dụ chữ

**Tiêu chí hoàn thành:** phân biệt được 4 thanh qua bài nghe; viết được 150 chữ HSK1 bằng quiz nét.

---

## Phase 5 — Kỹ năng Nghe 听

### 5.1 Component bài tập chung
- [ ] `Exercise` lưu `payload` JSON + `answer` JSON → 1 component render theo `type`
- [ ] `POST /api/attempt` ghi kết quả

### 5.2 Các dạng bài
- [ ] **Nghe → đúng/sai với tranh** (HSK1–2)
- [ ] **Nghe → chọn đáp án** (câu ngắn, hội thoại 2 lượt)
- [ ] **Chép chính tả** `Dictation.tsx`: nghe câu → gõ pinyin hoặc 汉字; so khớp bỏ dấu câu, khoảng trắng
- [ ] **Nghe hội thoại dài → trả lời câu hỏi** (HSK3–4)

### 5.3 Tiện ích nghe
- [ ] Tốc độ 0.75x / 1x / 1.25x
- [ ] Nút nghe lại, giới hạn số lần nghe (chế độ thi)
- [ ] Hiện transcript sau khi trả lời

### 5.4 Nội dung
- [ ] 20 bài nghe HSK1, 20 bài HSK2 (câu do bạn/LLM soạn, chỉ dùng từ trong cấp, tự duyệt)

**Tiêu chí hoàn thành:** làm được 1 bộ 10 câu nghe HSK1, có chấm điểm và transcript.

---

## Phase 6 — Kỹ năng Đọc 读

### 6.1 Trình đọc `/reading/[id]`
- [ ] Tách bài đọc thành từ (lưu sẵn mảng token trong JSON, không tách tự động lúc chạy)
- [ ] Bấm vào từ → popup pinyin + nghĩa + nút "Thêm vào ôn tập"
- [ ] `PinyinToggle`: bật/tắt pinyin trên đầu chữ (`<ruby>`); mặc định bật cho HSK1–2
- [ ] Nút đọc to toàn bài (TTS)

### 6.2 Câu hỏi đọc hiểu
- [ ] Ghép câu với tranh (HSK1–2)
- [ ] Chọn từ điền chỗ trống (HSK2–4)
- [ ] Sắp xếp 3 câu thành đoạn (HSK4)
- [ ] Đọc đoạn → trả lời câu hỏi

### 6.3 Nội dung
- [ ] 10 bài đọc mỗi cấp HSK1–2, độ dài: HSK1 ~50 chữ, HSK2 ~100 chữ
- [ ] Script kiểm tra: mọi từ trong bài thuộc cấp ≤ N (báo từ vượt cấp)

**Tiêu chí hoàn thành:** đọc được bài HSK1, tra từ bằng 1 click, từ tra được đưa vào SRS.

---

## Phase 7 — Ngữ pháp

### 7.1 Dữ liệu
- [ ] Liệt kê điểm ngữ pháp theo cấp (tham khảo Chinese Grammar Wiki, tự viết lại bằng tiếng Việt)
  - HSK1 ví dụ: 是, 吗, 呢, 的, 不/没, 了 (cơ bản), 在, 想, 会/能, số lượng từ
  - HSK2 ví dụ: 过, 着, 比, 就, 还/已经, bổ ngữ kết quả, 因为…所以…
  - HSK3 ví dụ: 把, 被, bổ ngữ xu hướng, bổ ngữ khả năng, 越来越, 除了…以外
  - HSK4 ví dụ: 连…都, 无论…都, 既…又, 不仅…而且, 即使…也
- [ ] Mỗi điểm: tiêu đề, công thức, giải thích, 3–5 ví dụ, lỗi hay gặp

### 7.2 Trang `/grammar/[id]`
- [ ] Hiển thị công thức tô màu theo thành phần câu
- [ ] 5–10 bài tập: chọn đáp án, `ReorderSentence` (kéo thả), tìm câu sai
- [ ] Gắn điểm ngữ pháp vào bài học tương ứng (`LessonItem`)

**Tiêu chí hoàn thành:** mỗi bài học HSK1 có ít nhất 1 điểm ngữ pháp kèm bài tập.

---

## Phase 8 — Kỹ năng Nói 说

### 8.1 Ghi âm
- [ ] `Recorder.tsx` dùng `MediaRecorder`: ghi → nghe lại → so với mẫu
- [ ] Lưu bản ghi vào IndexedDB (không cần lên server)

### 8.2 Nhận diện giọng nói
- [ ] `src/lib/speech.ts`: `webkitSpeechRecognition`, `lang = "zh-CN"`
- [ ] `src/lib/compare.ts`: so sánh text nhận được với câu gốc theo từng chữ (edit distance), tô xanh/đỏ
- [ ] Fallback khi trình duyệt không hỗ trợ: chỉ còn chế độ ghi âm tự nghe

### 8.3 Dạng bài
- [ ] **Shadowing**: nghe câu → nói theo → điểm khớp %
- [ ] **Đọc to** từ/câu trong bài học
- [ ] **Trả lời câu hỏi** bằng giọng nói (HSK3–4)
- [ ] (Tùy chọn) Azure Pronunciation Assessment để chấm thanh điệu → API route `api/pronounce`, key trong `.env`

**Tiêu chí hoàn thành:** đọc 1 câu HSK1, thấy chữ nào sai được tô đỏ.

---

## Phase 9 — Kỹ năng Viết 写

### 9.1 Bài tập không cần AI
- [ ] Gõ pinyin → chọn chữ (luyện bộ gõ)
- [ ] Điền chữ còn thiếu theo pinyin (dạng đề HSK3)
- [ ] Sắp xếp từ thành câu (dạng đề HSK3–4)
- [ ] Bật mode `recall` của ReviewCard

### 9.2 Chấm bằng LLM (tùy chọn)
- [ ] `POST /api/grade`: gửi đề + câu trả lời → nhận JSON `{ score, errors[], corrected, explanationVi }`
- [ ] Validate output bằng `zod`; API key chỉ ở `.env`, không lộ ra client
- [ ] Dạng bài: đặt câu với từ cho trước + tranh (HSK4), viết đoạn ngắn
- [ ] Lưu lỗi hay mắc → gợi ý ôn điểm ngữ pháp liên quan

**Tiêu chí hoàn thành:** viết 1 câu với từ cho trước, nhận câu sửa + giải thích tiếng Việt.

---

## Phase 10 — Mở rộng HSK3–4

- [ ] Duyệt nghĩa Việt + ví dụ cho từ HSK3 (600) và HSK4 (1200)
- [ ] Chia bài, seed lại
- [ ] Bài nghe/đọc/ngữ pháp cho HSK3–4 (lặp lại quy trình Phase 5–7)
- [ ] Mặc định tắt pinyin từ HSK3
- [ ] Kiểm tra hiệu năng ôn tập khi có >2000 thẻ (đánh index `ReviewCard.due`)

**Tiêu chí hoàn thành:** đủ dữ liệu HSK1–4, mọi trang chạy với cả 4 cấp.

---

## Phase 11 — Thi thử HSK

- [ ] Định nghĩa cấu trúc đề theo [Phụ lục C](#phụ-lục-c--cấu-trúc-đề-hsk14) (lưu JSON trong `MockTest.sections`)
- [ ] Tạo đề: bốc ngẫu nhiên `Exercise` theo dạng + cấp (không lặp câu đã làm gần đây)
- [ ] Đồng hồ đếm ngược từng phần, nghe chỉ phát 1–2 lần
- [ ] Nộp bài → điểm từng phần, quy đổi thang 100/phần, đỗ/trượt (HSK1–2: ≥120/200; HSK3–4: ≥180/300)
- [ ] Xem lại đáp án + transcript; câu sai → thêm vào ôn tập
- [ ] Lịch sử điểm thi thử

**Tiêu chí hoàn thành:** làm trọn 1 đề HSK1 có đồng hồ, ra điểm và xem lại được.

---

## Phase 12 — Dashboard & Thống kê

- [ ] Biểu đồ số thẻ ôn 30 ngày tới (dự báo tải)
- [ ] Độ chính xác theo kỹ năng (Nghe/Nói/Đọc/Viết) từ `Attempt`
- [ ] Tiến độ từ vựng từng cấp (đã học / đã thuộc = stability > 21 ngày)
- [ ] Top 20 từ hay sai (leech) → nút "Học lại"
- [ ] Heatmap ngày học + streak
- [ ] Xuất/nhập backup (JSON) để không mất tiến độ

**Tiêu chí hoàn thành:** nhìn dashboard biết hôm nay cần làm gì và kỹ năng nào yếu.

---

## Phase 13 — Deploy & PWA (tùy chọn)

- [ ] Đổi `provider` sang `postgresql`, dùng Supabase/Neon
- [ ] Thêm đăng nhập (Auth.js) nếu public lên mạng — **bắt buộc** nếu có API LLM để tránh bị lạm dụng key
- [ ] Deploy Vercel, biến môi trường cho DB + API key
- [ ] PWA: manifest + service worker cache dữ liệu từ vựng để ôn offline

---

## Phụ lục A — Schema Prisma đầy đủ

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"  url = env("DATABASE_URL") }

model Level {
  id       Int            @id          // 1..4
  name     String                      // "HSK1"
  words    Word[]
  lessons  Lesson[]
  grammar  GrammarPoint[]
  passages Passage[]
}

model Lesson {
  id      Int          @id @default(autoincrement())
  levelId Int
  level   Level        @relation(fields: [levelId], references: [id])
  order   Int
  title   String
  topic   String
  doneAt  DateTime?
  items   LessonItem[]
  @@unique([levelId, order])
}

model Word {
  id         Int             @id @default(autoincrement())
  hanzi      String          @unique
  pinyin     String
  meaningVi  String
  meaningEn  String?
  pos        String?         // loại từ
  levelId    Int
  level      Level           @relation(fields: [levelId], references: [id])
  examples   String          // JSON: [{hanzi, pinyin, vi}]
  audioUrl   String?
  characters WordCharacter[]
}

model Character {
  id        Int             @id @default(autoincrement())
  char      String          @unique
  pinyin    String
  radical   String?
  strokes   Int?
  meaningVi String?
  words     WordCharacter[]
}

model WordCharacter {
  wordId      Int
  characterId Int
  position    Int
  word        Word      @relation(fields: [wordId], references: [id])
  character   Character @relation(fields: [characterId], references: [id])
  @@id([wordId, characterId, position])
}

model GrammarPoint {
  id          Int    @id @default(autoincrement())
  levelId     Int
  level       Level  @relation(fields: [levelId], references: [id])
  title       String
  pattern     String
  explanation String
  examples    String // JSON
  mistakes    String? // JSON
}

model Passage {
  id        Int    @id @default(autoincrement())
  levelId   Int
  level     Level  @relation(fields: [levelId], references: [id])
  type      String // reading | dialogue
  title     String
  tokens    String // JSON: [{t:"我", p:"wǒ", vi:"tôi"}]
  audioUrl  String?
  questions String // JSON
}

model LessonItem {
  id       Int    @id @default(autoincrement())
  lessonId Int
  lesson   Lesson @relation(fields: [lessonId], references: [id])
  itemType String // word | grammar | passage | exercise
  itemId   Int
  order    Int
}

model Exercise {
  id      Int       @id @default(autoincrement())
  levelId Int
  skill   String    // listening | reading | writing | speaking | grammar
  type    String    // mcq | truefalse | dictation | reorder | fillblank | shadowing | compose
  payload String    // JSON đề
  answer  String    // JSON đáp án
  attempts Attempt[]
}

model ReviewCard {
  id        Int       @id @default(autoincrement())
  itemType  String    // word | character | sentence
  itemId    Int
  mode      String    // recognize | listen | recall | write
  fsrs      String    // JSON state của ts-fsrs
  due       DateTime
  suspended Boolean   @default(false)
  attempts  Attempt[]
  @@unique([itemType, itemId, mode])
  @@index([due])
}

model Attempt {
  id         Int         @id @default(autoincrement())
  exerciseId Int?
  exercise   Exercise?   @relation(fields: [exerciseId], references: [id])
  cardId     Int?
  card       ReviewCard? @relation(fields: [cardId], references: [id])
  skill      String
  correct    Boolean
  rating     Int?
  response   String?
  durationMs Int?
  createdAt  DateTime    @default(now())
  @@index([createdAt])
}

model MockTest {
  id       Int          @id @default(autoincrement())
  levelId  Int
  sections String       // JSON
  results  MockResult[]
}

model MockResult {
  id         Int      @id @default(autoincrement())
  mockTestId Int
  mockTest   MockTest @relation(fields: [mockTestId], references: [id])
  scores     String   // JSON {listening, reading, writing, total}
  answers    String   // JSON
  createdAt  DateTime @default(now())
}

model Setting {
  key   String @id
  value String
}
```

> SQLite không có kiểu JSON/array nên lưu `String` rồi `JSON.parse`. Khi chuyển Postgres có thể đổi sang `Json`.

---

## Phụ lục B — Định dạng dữ liệu JSON

`data/vocab/hsk1.json`
```json
[
  {
    "hanzi": "朋友",
    "pinyin": "péngyou",
    "meaningVi": "bạn bè",
    "meaningEn": "friend",
    "pos": "danh từ",
    "examples": [
      { "hanzi": "他是我的朋友。", "pinyin": "Tā shì wǒ de péngyou.", "vi": "Anh ấy là bạn của tôi." }
    ]
  }
]
```

`data/lessons/hsk1.json`
```json
[
  { "order": 1, "title": "Chào hỏi", "topic": "greeting",
    "words": ["你", "好", "您", "你们", "对不起", "没关系"],
    "grammar": ["你好吗"], "passages": [] }
]
```

`data/passages/hsk1.json`
```json
[
  {
    "type": "dialogue", "title": "Ở trường",
    "tokens": [ { "t": "你", "p": "nǐ", "vi": "bạn" }, { "t": "是", "p": "shì", "vi": "là" } ],
    "questions": [ { "q": "…", "options": ["A", "B", "C"], "answer": 0 } ]
  }
]
```

---

## Phụ lục C — Cấu trúc đề HSK1–4

> Số liệu theo cấu trúc HSK 2.0 phổ biến — kiểm tra lại với tài liệu chính thức trước khi làm Phase 11.

| Cấp | Nghe | Đọc | Viết | Tổng câu | Thời gian | Điểm đỗ |
|---|---|---|---|---|---|---|
| HSK1 | 20 câu | 20 câu | — | 40 | ~40 phút | 120/200 |
| HSK2 | 35 câu | 25 câu | — | 60 | ~55 phút | 120/200 |
| HSK3 | 40 câu | 30 câu | 10 câu (sắp xếp câu, điền chữ) | 80 | ~90 phút | 180/300 |
| HSK4 | 45 câu | 40 câu | 15 câu (sắp xếp câu, đặt câu theo tranh) | 100 | ~105 phút | 180/300 |

Nói (HSKK) là kỳ thi riêng — dùng Phase 8 để luyện, không đưa vào điểm thi thử.

---

## Phụ lục D — Rủi ro & lưu ý

- **Nhận diện giọng nói** (`webkitSpeechRecognition`) chỉ ổn trên Chrome, cần internet, không chấm thanh điệu. Muốn chấm thanh → Azure (tốn phí ngoài gói miễn phí).
- **Giọng TTS** trên Windows có thể không có `zh-CN` → cài thêm gói ngôn ngữ Trung trong Windows Settings, hoặc tạo sẵn mp3.
- **Nội dung do LLM sinh** (nghĩa Việt, ví dụ, bài đọc) có thể sai → luôn duyệt trước khi seed.
- **Bản quyền**: không sao chép đề thi thật, giáo trình (HSK Standard Course…) hay nguyên văn Grammar Wiki. Chỉ mô phỏng dạng đề, tự viết nội dung.
- **API key** (LLM, Azure) chỉ để trong `.env`, gọi qua API route phía server, không commit lên Git.
- **Sao lưu**: file `prisma/dev.db` chứa toàn bộ tiến độ học — backup định kỳ (Phase 12 có xuất JSON).
