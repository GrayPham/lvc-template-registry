# lvc-template-registry

Kho JSON template + thumbnail **miễn phí, công khai** cho app LVC Seedance. App đọc thẳng từ GitHub
(không qua máy chủ trung gian nào) — mở tab "Miễn phí" trong "Kho mẫu" là gọi thẳng
`raw.githubusercontent.com` lấy file `index.json` ở gốc repo này.

Đây là repo **độc lập** với workspace Rust/Tauri chính (`lvc_affilate`) — không phải code của app,
chỉ là nơi chứa dữ liệu mẫu mà app đọc qua mạng.

> Thiết kế đầy đủ (vì sao tách repo, hợp đồng dữ liệu, ADR): xem
> `docs/superpowers/specs/2026-10-11-remote-template-registry-design.md` và plan
> `docs/superpowers/plans/2026-10-11-p7-remote-template-registry.md` trong repo `lvc_affilate`.
> Đã tích hợp vào app (P7b) — provider Rust `crates/providers/lvc-template-registry`.

## Cấu trúc

```
index.json             NGUỒN CHÍNH — 1 mảng, mỗi phần tử 1 template ĐẦY ĐỦ (kèm graph).
                        App fetch URL này (xem DEFAULT_INDEX_URL trong provider Rust):
                        https://raw.githubusercontent.com/GrayPham/lvc-template-registry/master/index.json
thumbs/<id>.svg|png     ảnh thumbnail — index.json trỏ URL tuyệt đối raw.githubusercontent tới đây.
templates/<id>.json     bản nháp từng template RIÊNG LẺ (tiện sửa/diff) — KHÔNG phải nguồn app đọc,
                        chỉ để tham khảo/soạn trước khi gộp vào index.json.
api/, vercel.json       scaffold Vercel dự phòng (CHƯA dùng) — nếu sau này cần CDN/cache tốt hơn
                        thay vì gọi thẳng GitHub, xem mục 5.
```

Field của mỗi phần tử trong `index.json` (snake_case, khớp `RemoteTemplate` ở
`crates/providers/lvc-template-registry/src/model.rs`):

```jsonc
{
  "id": "ugc-unboxing-demo",       // slug on-nhu, chi chu thuong/so/gach ngang — khoa vinh vien
  "name": "...",
  "description": "...",
  "category": "Bán hàng/Sản phẩm", // dung de nhom/loc trong gallery
  "thumbnail": "https://raw.githubusercontent.com/GrayPham/lvc-template-registry/master/thumbs/<id>.svg",
  "updated_at": 1791715752000.0,   // epoch MILLISECONDS, dat tay moi lan sua
  "graph": { "version": 2, "nodes": [...], "edges": [...] } // Workflow JSON v2 cua app
}
```

`graph` phải là JSON hợp lệ theo schema Workflow v2 của app (xem file mẫu
`crates/lvc-app/templates/*.json` trong repo `lvc_affilate` để đối chiếu đúng field các node).

## Luật quan trọng — KHÔNG được chứa bí mật

Repo này **PHẢI public** (app đọc không cần token). Mọi template thêm vào:
- Tham số `account`/`credential` của mọi node phải để **rỗng** (`""`) — không bao giờ dán cookie,
  API key, mật khẩu, proxy thật vào `graph`.
- Không commit ảnh/dữ liệu có thông tin cá nhân của khách hàng thật.

Tự review bằng mắt trước mỗi lần push — chưa có lint tự động kiểm điều này.

## 1. Xác nhận repo đã PUBLIC

Vào `github.com/GrayPham/lvc-template-registry` → Settings → Danger Zone → "Change visibility" →
Public (nếu chưa). Hoặc qua CLI (cần `gh auth login` trước):

```powershell
gh repo edit GrayPham/lvc-template-registry --visibility public
```

Kiểm tra đã public bằng cách mở (không cần đăng nhập gì):
`https://raw.githubusercontent.com/GrayPham/lvc-template-registry/master/index.json`

## 2. Push `index.json` + `thumbs/`

```powershell
cd d:\LVCMedia\lvc-template-registry
git add index.json thumbs README.md
git commit -m "feat: index.json nguon chinh cho app doc truc tiep"
git push
```

## 3. Thêm template mới

1. Trong app, xây workflow mẫu trên canvas, "Lưu thành mẫu" để lấy đúng JSON `graph` (hoặc tự viết
   tay theo mẫu trong `index.json`).
2. **Xoá hết bí mật** trong `graph` (mọi `account` → `""`).
3. Thêm 1 phần tử mới vào mảng `index.json` (id chỉ gồm chữ thường/số/gạch ngang, không trùng id
   cũ).
4. Thêm ảnh `thumbs/<id-moi>.svg` hoặc `.png` (giữ nhẹ, vài trăm KB là đủ), `thumbnail` trong
   `index.json` trỏ URL `raw.githubusercontent.com` tới đúng ảnh đó.
5. Commit + push. App cache theo lần mở tab "Miễn phí" tiếp theo — không cần làm gì thêm, không cần
   build lại app.

## 4. App đọc ra sao?

`crates/providers/lvc-template-registry::RegistryClient` (trong `lvc_affilate`) GET thẳng
`index.json`, cache vào SQLite (bảng `remote_templates_cache`), hiện trong tab "Miễn phí" của "Kho
mẫu". Mất mạng → app tự dùng bản cache lần tải gần nhất. Đổi nguồn (fork repo riêng) → sửa
`DEFAULT_INDEX_URL` trong `client.rs` (chưa cấu hình được qua Settings UI ở bản này).

## 5. Phương án dự phòng: Vercel (chưa dùng)

`api/`, `vercel.json`, `templates/*.json` trong repo này là scaffold cho phương án dùng Vercel làm
lớp trung gian (2 endpoint `/api/templates`, `/api/templates/:id`) — hữu ích nếu sau này cần CDN/
cache tốt hơn raw GitHub, hoặc muốn giữ repo nguồn PRIVATE (Vercel giữ token server-side). Hiện
KHÔNG phải đường app dùng — có thể bỏ qua các file này.
