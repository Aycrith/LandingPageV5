import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

type TelemetryWindow = Window & {
  __R3F_TELEMETRY?: () => unknown;
};

test.describe('WebGL Telemetry Audit', () => {
  test('capture frame-by-frame telemetry and visuals', async ({ page }) => {
    test.setTimeout(240000);
    
    // Add audit query parameter to enable the probe
    await page.goto('/?audit=1');

    // Wait for the application to be ready (canvas and DOM)
    await page.waitForSelector('canvas', { state: 'attached', timeout: 30000 });
    
    // Additional wait for any initial loading screens to clear or scenes to stabilize
    await page.waitForTimeout(5000);

    const steps = 20; // 5% increments
    const dir = path.join(process.cwd(), 'test-results', 'audit');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    for (let i = 0; i <= steps; i++) {
      const increment = i / steps; // 0 to 1
      
      await page.evaluate(async (progress) => {
        const auditWindow = window as TelemetryWindow & {
          __LPV5_VIEWPORT_AUDIT__?: {
            setProgress: (value: number) => void;
          };
        };

        if (auditWindow.__LPV5_VIEWPORT_AUDIT__) {
          auditWindow.__LPV5_VIEWPORT_AUDIT__.setProgress(progress);
          return;
        }

        const maxScroll =
          Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.documentElement.clientHeight
          ) - window.innerHeight;

        window.scrollTo({
          top: maxScroll * progress,
          behavior: 'instant',
        });
      }, increment);

      // Wait a moment for R3F, gsap, and shaders to render the new state
      await page.waitForTimeout(700);

      // 1. Capture Telemetry
      const telemetry = await page.evaluate(() => {
        const telemetryWindow = window as TelemetryWindow;
        if (typeof telemetryWindow.__R3F_TELEMETRY === 'function') {
          return telemetryWindow.__R3F_TELEMETRY();
        }
        return null;
      });

      if (telemetry) {
        fs.writeFileSync(
          path.join(dir, `telemetry-${i}.json`),
          JSON.stringify({ frame: i, progress: increment, ...telemetry }, null, 2)
        );
      } else {
        console.warn(`[Audit] Telemetry probe missing on frame ${i}.`);
      }

      // 2. Capture Screenshot
      await page.screenshot({ 
        path: path.join(dir, `frame-${i}.png`), 
        fullPage: false,
        animations: 'disabled'
      });
    }
    
    // Basic assertion to ensure we gathered data
    const files = fs.readdirSync(dir);
    expect(files.filter(f => f.endsWith('.json')).length).toBeGreaterThan(0);
    expect(files.filter(f => f.endsWith('.png')).length).toBeGreaterThan(0);
  });
});
