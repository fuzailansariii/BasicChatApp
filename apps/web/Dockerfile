FROM node:22-alpine

WORKDIR /app

# Copy root-level configs
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy all package.json files for workspace deps
COPY apps/web/package*.json ./apps/web/

# Install dependencies (monorepo aware)
RUN corepack enable && pnpm install --filter web...

# Copy full source
COPY . .

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "dev"]
