import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@sphere-coop/shared': path.join(process.cwd(), 'packages/shared/src/index.ts'),
    },
  },
  test: {
    globals: true,
  },
});
