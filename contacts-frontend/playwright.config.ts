import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // ✅ Run tests in PARALLEL (biggest speed boost)
  fullyParallel: true,

  // ✅ No retries (faster - only add retries in CI)
  retries: 0,

  // ✅ Use multiple workers (uses all CPU cores)
  workers: 4,

  // ✅ Faster timeout
  timeout: 15000,        // 15s per test (was 60s)

  expect: {
    timeout: 5000        // 5s for assertions (was 10s)
  },

  reporter: [
    ['list'],            // ✅ Simple list output (faster than HTML)
    ['html', { open: 'never' }]  // Generate but don't auto-open
  ],

  use: {
    baseURL: 'http://localhost:4200',

    // ✅ Only record on failure
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',           // ✅ OFF by default (huge speed boost)

    // ✅ Faster browser settings
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-default-apps',
        '--no-first-run',
      ]
    },

    // ✅ Faster navigation
    actionTimeout: 8000,
    navigationTimeout: 10000,
  },

  projects: [
    {
      // ✅ Only test Chromium (skip Firefox/Safari = 3x faster)
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // ✅ Smaller viewport = faster rendering
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // ✅ Auto start servers
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,  // ✅ Reuse if already running
    timeout: 60000,
  },
});
