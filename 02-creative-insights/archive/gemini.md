# Deployment Fix Instructions

To prevent deployment failures during \`RUN npm run build\` due to corrupted Vite binary symlinks (ERR_MODULE_NOT_FOUND), and to avoid \`E401\` authentication errors during \`npm install\` due to private registry references in \`package-lock.json\`, the \`Dockerfile\` has been updated.

## Fixes Applied

### 1. Avoid private registry issues (E401)
In the initial copy step, we now only copy \`package.json\` instead of \`package*.json\`. This prevents the builder from using the local \`package-lock.json\` which may contain pointers to a private registry that the container cannot access:
\`\`\`dockerfile
COPY package.json ./
RUN npm install
\`\`\`

### 2. Protect Container Isolation (Vite symlink issue)
Later in the file, after copying the rest of the source code via \`COPY . .\`, we forcefully wipe the local \`node_modules\` folder and the \`package-lock.json\` file before running a fresh \`npm install\` and building. This ensures the container builds its own correct symlinks for the Linux environment:
\`\`\`dockerfile
COPY . .
RUN rm -rf node_modules && rm -f package-lock.json && npm install && npm run build
\`\`\`
