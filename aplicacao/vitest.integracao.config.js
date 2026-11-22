import { defineConfig } from "vitest/config";

// Suíte de integração: usa o banco de teste (TESTE_* no .env)
export default defineConfig({
  test: {
    include: ["tests/integracao/**/*.test.js"],
    setupFiles: ["tests/integracao/apoio/setup.js"],
    fileParallelism: false,
    pool: "forks",
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
