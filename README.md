# lvc-template-registry

Kho JSON template + thumbnail **miễn phí, công khai** cho app LVC Seedance. Dữ liệu nằm trong repo
GitHub này (ai cũng xem được trực tiếp trên GitHub); một API nhỏ host trên Vercel đọc đúng các file
này và trả JSON cho app gọi lên khi mở "Kho mẫu".

Đây là repo **độc lập** với workspace Rust/Tauri chính (`lvc_affilate`) — không phải code của app,
chỉ là nơi chứa dữ liệu mẫu + API đọc dữ liệu đó.

> Thiết kế đầy đủ (vì sao tách repo, hợp đồng dữ liệu, cách app sẽ tích hợp ở giai đoạn sau): xem
> `docs/superpowers/specs/2026-10-11-remote-template-registry-design.md` và plan
> `docs/superpowers/plans/2026-10-11-p7-remote-template-registry.md` trong repo `lvc_affilate`.

## Cấu trúc

```
templates/<id>.json   1 file = 1 template (id, name, description, category, thumbnail, updatedAt, graph)
thumbs/<id>.svg|png   ảnh thumbnail, đường dẫn tương đối "/thumbs/<id>.svg" trong file JSON
api/templates/index.js    GET /api/templates      -> danh sách meta (không có graph)
api/templates/[id].js     GET /api/templates/<id> -> 1 template đầy đủ (có graph)
```

`graph` phải là JSON hợp lệ theo schema Workflow v2 của app (xem file mẫu
`crates/lvc-app/templates/*.json` trong repo `lvc_affilate` để đối chiếu đúng field các node).

## Luật quan trọng — KHÔNG được chứa bí mật

Repo này **public**. Mọi template thêm vào:
- Tham số `account`/`credential` của mọi node phải để **rỗng** (`""`) — không bao giờ dán cookie,
  API key, mật khẩu, proxy thật vào `graph`.
- Không commit ảnh/dữ liệu có thông tin cá nhân của khách hàng thật.

Tự review bằng mắt trước mỗi lần push — chưa có lint tự động kiểm điều này.

## 1. Chạy thử cục bộ (trước khi deploy)

Cần Node.js đã cài sẵn. Cài Vercel CLI (một lần):

```powershell
npm install -g vercel
```

Chạy dev server ngay trong thư mục này:

```powershell
cd d:\LVCMedia\lvc-template-registry
vercel dev
```

Mở `http://localhost:3000/api/templates` phải thấy JSON danh sách; mở
`http://localhost:3000/api/templates/ugc-unboxing-demo` phải thấy JSON đầy đủ có `graph`.

## 2. Tạo repo GitHub (khi bạn sẵn sàng public)

```powershell
cd d:\LVCMedia\lvc-template-registry
git init
git add .
git commit -m "chore: scaffold template registry"
gh repo create lvc-template-registry --public --source=. --remote=origin --push
```

(Cần `gh auth login` trước nếu chưa đăng nhập GitHub CLI.)

## 3. Deploy lên Vercel

Cách nhanh nhất — kết nối trực tiếp qua CLI (hỏi đăng nhập Vercel trong trình duyệt lần đầu):

```powershell
vercel          # deploy preview, hỏi vài câu (project name, chọn account)
vercel --prod   # deploy production, ra URL kiểu https://lvc-template-registry.vercel.app
```

Hoặc vào `vercel.com` → "Add New Project" → chọn repo GitHub vừa tạo → Deploy (không cần chỉnh gì,
không có framework, không có build step).

Ghi lại URL production (vd `https://lvc-template-registry.vercel.app`) — đây là URL sẽ điền vào
Settings của app ở giai đoạn P7b (chưa code).

## 4. Thêm template mới (sau khi đã deploy)

1. Trong app, xây workflow mẫu trên canvas, "Lưu thành mẫu" để lấy đúng JSON `graph` (hoặc tự viết
   tay theo cấu trúc file mẫu `templates/ugc-unboxing-demo.json`).
2. **Xoá hết bí mật** trong `graph` (mọi `account` → `""`).
3. Thêm file `templates/<id-moi>.json` (id chỉ gồm chữ thường/số/gạch ngang, khớp tên file).
4. Thêm ảnh `thumbs/<id-moi>.svg` hoặc `.png` (giữ nhẹ, vài trăm KB là đủ).
5. Commit + push — Vercel tự deploy lại khi push lên nhánh chính (nếu đã nối GitHub integration);
   nếu deploy bằng CLI tay thì chạy lại `vercel --prod`.

## 5. Khi nào app thật sự gọi được URL này?

Hiện tại (P7a) app **chưa biết** registry này tồn tại — đây chỉ là scaffold + hướng dẫn deploy theo
yêu cầu "soạn code trước, tự deploy khi sẵn sàng". Việc app gọi lên URL này (tab "Kho mẫu" thêm
nguồn thứ 3, cache offline, cấu hình URL trong Settings…) là **P7b**, chưa code — xem câu hỏi mở
trong spec trước khi làm (tab riêng hay gộp vào Public? URL mặc định hay để trống?).
