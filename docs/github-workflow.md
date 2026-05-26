# GitHub Workflow — ESTEC Wildfire Warning System

> Tài liệu nội bộ dành cho team dev. Cập nhật lần cuối: 2026-05-22. Đã thực thi thực tế — subtree push thành công cả main lẫn develop.

---

## 1. Tổng quan repo

| Repo | URL | Nội dung |
|------|-----|----------|
| **Backend** | https://github.com/estec-digital/ESTEC-Wildfire-Warning-System-BE | `backend_api/`, `ingestion_worker/`, `database/`, `mosquitto/`, `scripts/`, `docker-compose.yml` |
| **Frontend** | https://github.com/estec-digital/ESTEC-Wildfire-Warning-System-FE | `frontend-app/` (React + Vite + Leaflet) |

Hai repo **độc lập** — không phải submodule, không phải mono-repo.

---

## 2. Chiến lược nhánh (Branching Strategy)

```
main          ← production-ready, chỉ merge qua PR được review
 └── develop  ← integration branch, chạy staging
      └── feature/<tên>   ← tính năng mới
      └── fix/<tên>       ← bug fix
      └── hotfix/<tên>    ← fix khẩn trên main
```

| Nhánh | Mục đích | Ai push trực tiếp |
|-------|----------|-------------------|
| `main` | Production | **Không ai** — chỉ merge qua PR, KHÔNG push trực tiếp |
| `develop` | Staging / integration | **Không ai** — chỉ merge qua PR từ feature/fix |
| `feature/*` | Từng tính năng | Dev tự push |
| `fix/*` | Bug fix thông thường | Dev tự push |
| `hotfix/*` | Fix lỗi urgent trên prod | Tech lead hoặc dev được phân công |

### Quy tắc đặt tên nhánh

```
feature/module-05-draw-measure
fix/login-token-expired
hotfix/fire-alert-missing-coordinates
```

---

## 3. Commit Convention

Dùng **Conventional Commits**:

```
<type>(<scope>): <mô tả ngắn>
```

| Type | Dùng khi |
|------|---------|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa bug |
| `refactor` | Tái cấu trúc code, không thêm/xóa tính năng |
| `chore` | Config, dependency, build |
| `docs` | Chỉ thay đổi tài liệu |
| `style` | Format, CSS, không ảnh hưởng logic |
| `test` | Thêm/sửa test |

**Ví dụ:**
```
feat(module-23): implement multi-attribute search
fix(auth): handle expired JWT token gracefully
chore(deps): upgrade leaflet to 1.9.4
docs(api): add endpoint docs for fire alert
```

---

## 4. Cách push code lên 2 repo công ty

> **Phương án thực tế đang dùng: `git subtree`** — chỉ push code và history của từng subfolder, 2 repo hoàn toàn tách riêng nhau.

### 4.1 Chuẩn bị tài khoản GitHub công ty

Đảm bảo tài khoản GitHub của bạn đã được add vào org `estec-digital`.

**Kiểm tra credential hiện tại:**
```powershell
git config --global user.name
git config --global user.email
```

**Nếu cần đổi sang tài khoản công ty (chỉ cho repo này):**
```powershell
git config user.name "Tên Của Bạn"
git config user.email "email-cong-ty@estec.vn"
```

---

### 4.2 Setup remote (chỉ làm 1 lần duy nhất)

Từ thư mục root mono-repo:

```powershell
cd D:\workspace\workspace\dev\projects\estec-wildfire-code\estec---wildfire---code

git remote add company-be https://github.com/estec-digital/ESTEC-Wildfire-Warning-System-BE.git
git remote add company-fe https://github.com/estec-digital/ESTEC-Wildfire-Warning-System-FE.git
```

Xác nhận:
```powershell
git remote -v
# company-be  https://github.com/estec-digital/ESTEC-Wildfire-Warning-System-BE.git
# company-fe  https://github.com/estec-digital/ESTEC-Wildfire-Warning-System-FE.git
# origin      https://github.com/doanngocminhthang/estec-wildfire-system.git
```

---

### 4.3 Push lên 2 repo công ty (lần đầu hoặc khi có commit mới)

**Backend** — chỉ push thư mục `backend_api/`:
```powershell
git subtree push --prefix=backend_api company-be main
git subtree push --prefix=backend_api company-be develop
```

**Frontend** — chỉ push thư mục `frontend-app/`:
```powershell
git subtree push --prefix=frontend-app company-fe main
git subtree push --prefix=frontend-app company-fe develop
```

> Lần push sau (có commit mới), chạy y chang lệnh trên — subtree tự diff và chỉ push phần thay đổi.

> `git subtree` lọc đúng commit liên quan đến subfolder, repo công ty không bị lẫn code của nhau.

---

## 5. Quy trình làm việc hàng ngày

```
1. Pull develop mới nhất
   git checkout develop
   git pull origin develop

2. Tạo nhánh tính năng
   git checkout -b feature/ten-tinh-nang

3. Code, commit thường xuyên
   git add .
   git commit -m "feat(scope): mô tả"

4. Push nhánh lên remote
   git push origin feature/ten-tinh-nang

5. Mở Pull Request: feature → develop
   - Assign reviewer
   - Điền mô tả rõ: làm gì, test case, screenshot nếu có UI

6. Sau khi PR được approve → Merge vào develop
   (Squash merge để giữ history gọn)

7. Khi đủ tính năng cho release → Mở PR: develop → main
```

---

## 6. Pull Request Checklist

Trước khi mở PR, tự check:

- [ ] Code chạy không lỗi locally
- [ ] Không có file `.env`, secret, password trong commit
- [ ] Tên nhánh đúng convention
- [ ] Commit message đúng Conventional Commits
- [ ] Đã test tính năng chính + edge case
- [ ] Không để lại `console.log` debug thừa
- [ ] PR description mô tả rõ: **làm gì**, **tại sao**, **test như thế nào**

---

## 7. Xử lý xung đột (Merge Conflict)

```powershell
# Đang ở nhánh feature của bạn
git fetch origin
git merge origin/develop

# Xử lý conflict trong file (dùng VS Code hoặc editor)
# Sau khi xử lý xong:
git add .
git commit -m "chore: resolve merge conflicts with develop"
git push origin feature/ten-tinh-nang
```

---

## 8. Hotfix quy trình

```powershell
# Checkout từ main
git checkout main
git pull origin main
git checkout -b hotfix/mo-ta-loi

# Fix, commit, push
git add .
git commit -m "fix(critical): mo-ta-loi"
git push origin hotfix/mo-ta-loi

# Mở PR: hotfix → main  (merge ngay sau review)
# Sau đó merge hotfix → develop để sync
git checkout develop
git merge hotfix/mo-ta-loi
git push origin develop
```

---

## 9. Quản lý credential nhiều tài khoản GitHub

Nếu máy dùng nhiều tài khoản (cá nhân + công ty):

**Phương án A — Git Credential Manager (Windows):**
```powershell
# Xem credential đang lưu
cmdkey /list | findstr git

# Xóa credential cũ để nhập lại
cmdkey /delete:LegacyGeneric:target=git:https://github.com
```
Sau khi xóa, lần push tiếp theo sẽ hỏi lại username/password (hoặc browser OAuth).

**Phương án B — SSH key riêng per account (recommended cho team):**

Tạo SSH key cho tài khoản công ty:
```powershell
ssh-keygen -t ed25519 -C "email-cong-ty@estec.vn" -f "$env:USERPROFILE\.ssh\id_ed25519_estec"
```

Thêm vào `~/.ssh/config`:
```
Host github-estec
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_estec

Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
```

Sử dụng remote với host alias:
```powershell
git remote add company-be git@github-estec:estec-digital/ESTEC-Wildfire-Warning-System-BE.git
git remote add company-fe git@github-estec:estec-digital/ESTEC-Wildfire-Warning-System-FE.git
```

---

## 10. Tóm tắt nhanh — Cheat Sheet

```powershell
# =============================================
# SETUP — chỉ chạy 1 lần duy nhất trên máy mới
# =============================================
git remote add company-be https://github.com/estec-digital/ESTEC-Wildfire-Warning-System-BE.git
git remote add company-fe https://github.com/estec-digital/ESTEC-Wildfire-Warning-System-FE.git

# =============================================
# PUSH LÊN 2 REPO CÔNG TY (lần đầu + mỗi lần có code mới)
# =============================================
# Backend
git subtree push --prefix=backend_api company-be main
git subtree push --prefix=backend_api company-be develop

# Frontend
git subtree push --prefix=frontend-app company-fe main
git subtree push --prefix=frontend-app company-fe develop

# =============================================
# LÀM VIỆC HÀNG NGÀY
# =============================================
git checkout develop
git pull origin develop
git checkout -b feature/ten-tinh-nang
# ... code, commit ...
git push origin feature/ten-tinh-nang
# → Mở Pull Request trên GitHub: feature → develop

# Sau khi PR được merge, sync develop về local:
git checkout develop
git pull origin develop
```
