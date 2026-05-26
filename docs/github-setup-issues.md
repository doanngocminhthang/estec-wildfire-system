# GitHub Setup — Vấn đề gặp phải & cách xử lý

> Ghi lại toàn bộ sự cố khi setup 2 repo công ty lần đầu (2026-05-22).  
> Mục đích: ai đọc cũng hiểu chuyện gì đã xảy ra, tránh lặp lại lỗi.

---

## Bối cảnh

Project hiện là **mono-repo** — chứa cả BE lẫn FE trong 1 repo duy nhất:

```
estec-wildfire-system/   ← repo cá nhân (origin)
├── backend_api/
├── frontend-app/
└── ...
```

Mục tiêu: tách ra 2 repo riêng cho công ty:
- `estec-digital/ESTEC-Wildfire-Warning-System-BE`
- `estec-digital/ESTEC-Wildfire-Warning-System-FE`

Công cụ dùng: `git subtree push` — chỉ push code và history của từng subfolder.

---

## Vấn đề 1: Push sai thứ tự — main và develop giống nhau

### Chuyện gì xảy ra

Chạy lệnh:
```powershell
git subtree push --prefix=backend_api company-be main
git subtree push --prefix=backend_api company-be develop
```

Cả 2 lệnh đều đang ở nhánh `develop` (HEAD = develop). `git subtree push` **luôn split từ HEAD**, bất kể tên nhánh đích ở cuối lệnh.

Kết quả: cả `main` lẫn `develop` trên company repos đều nhận cùng 1 commit — không có gì khác biệt.

### Hậu quả

Không tạo được PR `develop → main` vì GitHub báo:
```
No commits between main and develop
```

### Cách xử lý đúng từ lần sau

Phải checkout đúng nhánh nguồn trước khi push:

```powershell
# Push main — phải đang đứng ở nhánh main
git checkout main
git subtree push --prefix=backend_api company-be main
git subtree push --prefix=frontend-app company-fe main

# Push develop — phải đang đứng ở nhánh develop
git checkout develop
git subtree push --prefix=backend_api company-be develop
git subtree push --prefix=frontend-app company-fe develop
```

---

## Vấn đề 2: `frontend-app/` không tồn tại trên nhánh `main` của mono-repo

### Chuyện gì xảy ra

Khi chạy `git subtree split --prefix=frontend-app` từ nhánh `main`:
```
fatal: no new revisions were found
```

Vì toàn bộ code `frontend-app/` chỉ được thêm vào `develop`, chưa bao giờ merge vào `main`.

### Hậu quả

- Không có "main cũ" nào để so sánh với develop cho FE repo
- Mọi cách tạo "main ảo" (orphan commit) đều thất bại vì không có shared history với develop
- GitHub báo: `The develop branch has no history in common with main`

### Cách xử lý

Merge `develop → main` trên mono-repo trước, rồi mới push subtree:

```powershell
git checkout main
git merge develop --no-ff -m "feat: merge develop into main — Sprint 1 complete"
git push origin main

# Sau đó push subtree
git subtree push --prefix=backend_api company-be main
git subtree push --prefix=frontend-app company-fe main
```

---

## Vấn đề 3: GitHub CLI không cài được do thiếu quyền admin

### Chuyện gì xảy ra

```powershell
winget install GitHub.cli
# → You cancelled the installation (exit code 1602)
```

MSI installer hiện UAC prompt nhưng terminal không có quyền admin để approve.

### Cách xử lý

Cài qua **Scoop** — không cần admin:

```powershell
# Cài Scoop
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Cài gh
$env:PATH += ";$env:USERPROFILE\scoop\shims"
scoop install gh
```

> Lưu ý: mỗi lần mở terminal mới cần thêm PATH:
> ```powershell
> $env:PATH += ";$env:USERPROFILE\scoop\shims"
> ```
> Hoặc thêm vào `$PROFILE` để tự động load.

---

## Vấn đề 4: `gh auth login --with-token` báo lỗi 401

### Chuyện gì xảy ra

```powershell
echo "ghp_xxx" | gh auth login --with-token
# → error validating token: HTTP 401: Bad credentials
```

Token hợp lệ nhưng cách pipe trong PowerShell không hoạt động đúng với `gh`.

### Cách xử lý

Dùng biến môi trường `GH_TOKEN` thay vì pipe:

```powershell
$env:GH_TOKEN = "ghp_xxx"
gh auth status   # kiểm tra đã login chưa
gh pr create ... # dùng gh bình thường
```

> **Bảo mật:** Không share token trong chat hay commit vào git. Tạo token tại https://github.com/settings/tokens, dùng xong thì revoke.

---

## Trạng thái hiện tại (sau khi xử lý)

| Repo | `main` | `develop` | Ghi chú |
|------|--------|-----------|---------|
| `origin` (cá nhân) | ✓ Sprint 1 đầy đủ | ✓ Sprint 1 đầy đủ | Đã merge develop→main |
| `company-be` | ✓ code BE | ✓ code BE | main = develop (xem mục còn lại) |
| `company-fe` | ✓ code FE | ✓ code FE | main = develop (xem mục còn lại) |

---

## Việc còn lại / cần xử lý

### 1. ⏳ PR trên company repos chưa có diff thực sự

Do setup lần đầu bị lỗi thứ tự push, `main` và `develop` trên 2 company repos hiện đang cùng 1 commit. PR `develop → main` không có gì để merge.

**Không cần xử lý ngay** — lần commit mới tiếp theo sẽ tự nhiên tạo ra diff.

**Quy trình đúng từ giờ trở đi:**

```
1. Code trên develop của mono-repo
2. Commit + push lên origin/develop
3. Push subtree lên company repos:
   git subtree push --prefix=backend_api company-be develop
   git subtree push --prefix=frontend-app company-fe develop
4. Tạo PR trên GitHub: develop → main (trên company repos)
5. Sau khi PR được approve và merge trên GitHub → main của company repos cập nhật
6. KHÔNG cần merge main locally nữa
```

### 2. ✅ Token GitHub CLI chưa được lưu persistent

`GH_TOKEN` hiện chỉ tồn tại trong session terminal. Mỗi lần mở terminal mới phải set lại.

**Đã fix (2026-05-23):** Ghi trực tiếp token vào file config của `gh` tại:
```
%APPDATA%\GitHub CLI\hosts.yml
```

Nội dung file:
```yaml
github.com:
    oauth_token: <token>
    user: ESTEC-THANGDOAN
    git_protocol: https
```

Lệnh đã chạy:
```powershell
$hostsContent = @"
github.com:
    oauth_token: ghp_xxx
    user: ESTEC-THANGDOAN
    git_protocol: https
"@
Set-Content -Path "$env:APPDATA\GitHub CLI\hosts.yml" -Value $hostsContent -Encoding utf8
```

> Nếu token hết hạn: tạo token mới tại https://github.com/settings/tokens (scope: `repo`, `read:org`, `workflow`), rồi thay giá trị `oauth_token` trong file trên.

### 3. ✅ Scoop chưa được thêm vào PATH vĩnh viễn

Mỗi lần mở terminal mới, `gh` không nhận vì Scoop chưa có trong PATH.

**Đã fix (2026-05-23):** Tạo PowerShell profile và thêm Scoop vào PATH tự động:

```powershell
New-Item -ItemType File -Path $PROFILE -Force
Add-Content -Path $PROFILE -Value '$env:PATH += ";$env:USERPROFILE\scoop\shims"'
```

File profile nằm tại: `C:\Users\<tên>\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`

Từ giờ mỗi lần mở terminal mới, `gh` tự nhận — không cần set gì thêm.

---

## Bài học rút ra

| # | Bài học |
|---|---------|
| 1 | `git subtree push` luôn dùng HEAD — phải `git checkout <nhánh>` trước khi push |
| 2 | Push `main` trước, `develop` sau — để develop luôn ahead of main trên company repos |
| 3 | Không merge `develop → main` locally khi dùng subtree workflow — để GitHub quản lý qua PR |
| 4 | Dùng `GH_TOKEN` env var thay vì pipe token vào `gh auth login` trên PowerShell |
| 5 | Không share token trong chat — tạo xong dùng xong là revoke |
