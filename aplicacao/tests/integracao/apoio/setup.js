import { afterAll, beforeAll } from "vitest";

import "./ambiente";

import { fecharBanco, prepararBanco } from "./banco";

// O setup roda uma vez por arquivo de teste, cada arquivo reseta o banco e recomeça do seed, então um cenário não vaza no outro
beforeAll(async () => {
  await prepararBanco();
}, 120000);

afterAll(async () => {
  await fecharBanco();
});
