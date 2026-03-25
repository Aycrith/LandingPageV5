import { defineConfig } from "@playwright/test";

const PORT = 3100;
const HOST = "localhost";

export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    browserName: "chromium",
    headless: true,
    launchOptions: {
      args: [
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: {
      width: 1440,
      height: 900,
    },
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://${HOST}:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
