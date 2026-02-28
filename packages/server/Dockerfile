FROM node:20-alpine
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/

# Install all workspace dependencies (includes tsx from server devDependencies)
RUN npm install

# Copy source files
COPY tsconfig.base.json ./
COPY packages/shared/src ./packages/shared/src
COPY packages/server/src ./packages/server/src

EXPOSE 3001
CMD ["node_modules/.bin/tsx", "packages/server/src/index.ts"]
