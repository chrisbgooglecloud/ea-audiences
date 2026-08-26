# Plan: Create New Repository `insights-engine-marketing`

## 1. Overview
Create a new directory at `/Users/curtisgross/Documents/github/insights-engine-marketing`, transfer all project assets (excluding artifacts like `node_modules` and `dist`), initialize Git on the `main` branch, and publish as a private repository to GitHub under the authenticated personal account.

---

## 2. Step-by-Step Technical Approach

### Step A: Directory Creation & File Transfer
- Create directory `/Users/curtisgross/Documents/github/insights-engine-marketing`.
- Synchronize all source files, configurations, scripts, and documentation using `rsync` with explicit exclusions:
  - `node_modules/`
  - `.git/`
  - `dist/`
  - `.DS_Store`

### Step B: Local Git Repository Initialization
- Initialize a clean Git repository with `main` as the default branch (`git init -b main`).
- Verify `.gitignore` and `.dockerignore` are present and valid.
- Stage all project files: `git add .`.
- Create the initial commit: `git commit -m "Initial commit: Insights Engine Marketing"`.

### Step C: Remote Creation & Publishing
- Use GitHub CLI (`gh repo create`) to create a new private repository `insights-engine-marketing`.
- Set remote `origin` and push the `main` branch.

### Step D: Verification
- Verify `gh repo view` returns active repository metadata and confirms commit status.

---

## 3. Potential Risks & Mitigations
- **Large Files / Secrets in Repo**:
  - *Mitigation*: Ensure `.env`, `node_modules`, and local build outputs remain excluded by `.gitignore`.
- **Existing Remote Name Conflict**:
  - *Mitigation*: Check GitHub for repo name existence before creation.
