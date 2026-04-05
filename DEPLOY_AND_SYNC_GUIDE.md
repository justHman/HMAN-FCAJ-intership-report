# Deployment & Upstream Sync Guide

## 1. Deploying Update (GitHub Actions)

Whenever you add new content, modify configurations, or update code in this project, **bạn chỉ cần push code lên nhánh `main`**. Hệ thống GitHub Actions sẽ tự động làm phần việc dọn dẹp và đẩy code lên `gh-pages` cho bạn!

```bash
# Sau khi sửa code hoặc viết thêm bài mới
git add .
git commit -m "update: nội dung mới nhất"

# Push lên main
git push origin main
```

**Workflow này hoạt động ra sao?**
1. Khi có code mới trên `main`, GitHub Actions (`.github/workflows/pages-deploy.yml`) sẽ được kích hoạt.
2. Máy chủ GitHub sẽ tự động cài NPM và Build ra thư mục `dist`.
3. Cuối cùng server chủ động cập nhật nhánh `gh-pages` (chính là nhánh bạn cấu hình deploy).
4. Bạn có thể bấm vào thẻ **Actions** trên giao diện repo của GitHub để xem tiến trình xanh (✅) là hoàn thành.

*Note: Bạn không cần phải chạy `npm run deploy` bằng tay ở dưới máy nữa.*

## 2. Syncing Files from the Old Repository (Upstream)

Since you modified your git remotes, your local index recognizes two points of contact:
- `origin`: Your repository (`https://github.com/justHman/HMAN-FCAJ-intership-report.git`).
- `upstream`: The original repository (`https://github.com/hei1sme/hei-FCAJ-intership-report.git`).

If the original repository (`hei1sme`) uploads a new file, updates a `component`, or pushes new specific documentation that you want to bring into your repository without merging *everything*, follow these steps:

### Fetch Upstream Changes
First, retrieve all the newest changes from the original repository:
```bash
git fetch upstream
```

### Option A: Bring Over a Specific File or Folder
If you only need a specific file (like a new component or updated markdown content) from their `main` branch, use `git checkout`:

```bash
git checkout upstream/main -- path/to/the/file_or_folder
```

*Example: Taking the Layout.tsx file*
```bash
git checkout upstream/main -- src/components/Layout.tsx
```

Once merged into your local directory:
1. Review the changes using `git status` and `git diff --cached`.
2. Commit the change locally:
   ```bash
   git commit -m "sync: updated Layout.tsx from upstream"
   ```
3. Push to your own repository:
   ```bash
   git push origin main
   ```

### Option B: Merge All Changes (Caution)
If you want to pull all the latest updates they made and automatically merge them into your project (Note: this might cause merge conflicts if you've edited the same files):

```bash
# Verify you are on the main branch
git checkout main

# Merge their changes into yours
git merge upstream/main

# Resolve any merge conflicts, then commit and push
git push origin main
```