FROM node:22-alpine

WORKDIR /apps/socket

# Copy root workspace files first
COPY package*.json ./
COPY pnpm-lock*.yml ./
COPY pnpm-workspace*.yml ./

# Copy the specific app
COPY apps/socket/package*.json ./apps/socket/

# Copy shared packages that socket depends on
COPY packages/ ./packages/

# Install dependencies from root
RUN corepack enable && pnpm install --filter @repo/socket...

COPY . .
EXPOSE 4000
CMD ["pnpm", "--filter", "@repo/socket", "dev"]