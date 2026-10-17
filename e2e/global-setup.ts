import type {FullConfig} from '@playwright/test';
import {assertE2EServerProfile} from '../scripts/e2e-server-profile';

export default async function globalSetup(config: FullConfig) {
  // O Playwright já iniciou ou reutilizou webServer quando executa globalSetup.
  const baseURLs = new Set(config.projects.map((project) => project.use.baseURL));
  for (const baseURL of baseURLs) {
    if (!baseURL) throw new Error('[E2E] Defina baseURL para verificar o perfil do servidor.');
    await assertE2EServerProfile(baseURL);
  }
}
