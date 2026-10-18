import {defineConfig, devices} from '@playwright/test';
import {existsSync} from 'node:fs';
import {resolveE2EPort} from './scripts/e2e-port.mjs';

const PORT = resolveE2EPort(process.env.E2E_PORT);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const chromiumExecutablePath = existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutablePath ? {launchOptions: {executablePath: chromiumExecutablePath}} : {}),
      },
    },
  ],
  webServer: {
    command: 'node scripts/run.mjs e2e-server',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
