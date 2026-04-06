# Deployment & Upstream Sync Guide

## 1. Deploying Updates

### Option A — GitHub Actions (Recommended)

Whenever you add new content, modify configurations, or update code, **chỉ cần push code lên nhánh `main`**. GitHub Actions sẽ tự động build và đẩy lên `gh-pages`.

```bash
# Sau khi sửa code hoặc viết thêm bài mới
git add .
git commit -m "update: nội dung mới nhất"

# Push lên main — GitHub Actions sẽ tự động deploy
git push origin main
```

**Workflow hoạt động như sau:**
1. Khi có code mới trên `main`, GitHub Actions (`.github/workflows/pages-deploy.yml`) được kích hoạt.
2. Máy chủ GitHub tự động cài NPM và build ra thư mục `dist`.
3. Server chủ động cập nhật nhánh `gh-pages` (nhánh cấu hình deploy).
4. Bấm vào thẻ **Actions** trên repo GitHub để xem tiến trình — ✅ xanh là hoàn thành.

*Note: Bạn không cần chạy `npm run deploy` bằng tay nữa khi đã có GitHub Actions.*

### Option B — Manual Deploy (Local)

Nếu cần deploy thủ công từ máy local (ví dụ: GitHub Actions chưa được cấu hình):

```bash
# Install dependencies (only required once or if package.json changes)
npm install

# Build and deploy the site
npm run deploy
```

Running `npm run deploy` will:
1. Re-compile the application and generate static files in the `dist` folder.
2. Automatically push the `dist` folder to the `gh-pages` branch.
3. Automatically update your live site at `https://justHman.github.io/HMAN-FCAJ-intership-report/`.

*Note: Changes to GitHub Pages might take ~1-2 minutes to be visible online. Hard-refresh with Ctrl+F5 / Cmd+Shift+R.*

---

## 2. Syncing Files from the Upstream Repository

Your local git recognizes two remotes:
- `origin` — your repository: `https://github.com/justHman/HMAN-FCAJ-intership-report.git`
- `upstream` — original repository: `https://github.com/hei1sme/hei-FCAJ-intership-report.git`

If the original repo uploads new files, updates components, or pushes documentation you want to incorporate:

### Step 1: Fetch upstream changes

```bash
git fetch upstream
```

### Option A: Bring over a specific file or folder

```bash
git checkout upstream/main -- path/to/the/file_or_folder
```

*Example — sync a specific component:*
```bash
git checkout upstream/main -- src/components/Layout.tsx
```

Then commit and push:
```bash
git status && git diff --cached
git commit -m "sync: updated Layout.tsx from upstream"
git push origin main
```

### Option B: Merge all upstream changes (Caution)

> ⚠️ This may cause merge conflicts if you've edited the same files.

```bash
# Make sure you are on main
git checkout main

# Merge all upstream changes
git merge upstream/main

# Resolve any conflicts, then push
git push origin main
```