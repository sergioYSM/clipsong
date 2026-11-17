import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  workers: 3,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3000', trace: 'off', launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } },
  webServer: { command: 'npm run start', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
});
