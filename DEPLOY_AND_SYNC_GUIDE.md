# Deployment & Upstream Sync Guide

## 1. Deploying Update (GitHub Pages)

Whenever you add new content, modify configurations, or update code in this project, you can rebuild and push to GitHub Pages in a single command:

```bash
# Install dependencies (only required once or if package.json changes)
npm install

# Build and deploy the site
npm run deploy
```

Running `npm run deploy` will:
1. Re-compile the application and generate static files in the `dist` folder.
2. Automatically push the `dist` folder to the `gh-pages` branch.
3. Automatically update your live GitHub Pages site located at `https://justHman.github.io/HMAN-FCAJ-intership-report/`.

*Note: Changes to GitHub Pages might take ~1-2 minutes to be visible online. Make sure to hard-refresh (Ctrl+F5 / Cmd+Shift+R).*

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