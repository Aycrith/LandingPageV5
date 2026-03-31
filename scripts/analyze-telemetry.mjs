import fs from 'fs';
import path from 'path';

const STARTUP_READY_THRESHOLD_MS = 5000;
const SCROLL_P95_THRESHOLD_MS = 16.6;
const SCROLL_OVER_33_THRESHOLD = 2;

function analyze() {
  const dir = path.join(process.cwd(), 'test-results', 'audit');
  if (!fs.existsSync(dir)) {
    console.error('Audit directory not found. Please run the Playwright test first.');
    return;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('No telemetry files found in audit directory.');
    return;
  }

  const reports = [];

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    const frame = data.frame;
    const progress = (data.progress * 100).toFixed(0) + '%';
    const activeAct = data.scroll?.activeAct ?? 'Unknown';
    
    const renderPipeline = data.auditMetrics?.renderPipeline ?? null;
    const resourcePipeline = data.auditMetrics?.resourcePipeline ?? null;
    const telemetry = data.auditMetrics?.telemetry ?? null;
    const renderer = renderPipeline?.renderer ?? data.renderer ?? null;
    const lateRequestCount = telemetry?.lateRequestCount ?? 0;

    const analysis = {
      frame,
      progress,
      activeAct,
      calls: renderer?.calls ?? 0,
      triangles: renderer?.triangles ?? 0,
      startupReadyMs: telemetry?.startupPhaseTimings?.readyMs ?? null,
      p95ScrollLatencyMs: renderPipeline?.p95ScrollLatencyMs ?? null,
      over33ScrollLatencyMs: renderPipeline?.over33ScrollLatencyMs ?? 0,
      longTaskCount: renderPipeline?.longTasks?.count ?? 0,
      textureMemoryMB: renderPipeline?.memory?.estimatedTextureMemoryMB ?? null,
      budgetViolations: renderPipeline?.budget?.violations ?? [],
      lateEntryCriticalCount: resourcePipeline?.lateEntryCriticalCount ?? 0,
      lateNearScrollCount: resourcePipeline?.lateNearScrollCount ?? 0,
      fallbackTriggered: telemetry?.hasFallbackTriggered ?? false,
      warnings: [],
      overdrawRisk: 0,
      orphanMeshes: 0,
      lateRequestCount,
    };

    if ((analysis.startupReadyMs ?? Number.NEGATIVE_INFINITY) > STARTUP_READY_THRESHOLD_MS) {
      analysis.warnings.push(`Startup exceeded budget: ${analysis.startupReadyMs}ms`);
    }
    if ((analysis.p95ScrollLatencyMs ?? Number.NEGATIVE_INFINITY) > SCROLL_P95_THRESHOLD_MS) {
      analysis.warnings.push(`Scroll latency exceeded budget: ${analysis.p95ScrollLatencyMs}ms p95`);
    }
    if (analysis.over33ScrollLatencyMs > SCROLL_OVER_33_THRESHOLD) {
      analysis.warnings.push(
        `Too many slow scroll frames: ${analysis.over33ScrollLatencyMs} over 33ms`
      );
    }
    if (analysis.longTaskCount > 0) {
      analysis.warnings.push(`Long tasks detected: ${analysis.longTaskCount}`);
    }
    if (analysis.fallbackTriggered) {
      analysis.warnings.push(`Safe-mode fallback triggered`);
    }
    if (lateRequestCount > 0) {
      analysis.warnings.push(`Late startup requests detected: ${lateRequestCount}`);
    }
    if (analysis.lateEntryCriticalCount > 0 || analysis.lateNearScrollCount > 0) {
      analysis.warnings.push(
        `Late staged asset requests detected: entry=${analysis.lateEntryCriticalCount}, near=${analysis.lateNearScrollCount}`
      );
    }
    if (analysis.budgetViolations.length > 0) {
      analysis.warnings.push(
        `Runtime budget violations: ${analysis.budgetViolations.join(', ')}`
      );
    }

    // Analyze meshes for transparency/overdraw
    if (data.meshes) {
      for (const mesh of data.meshes) {
        const hasTransparent = mesh.materials.some((m) => m.transparent);
        if (hasTransparent && mesh.visible) {
          analysis.overdrawRisk++;
        }
      }
    }

    if (analysis.overdrawRisk > 5) {
       analysis.warnings.push(`High transparency overdraw risk: ${analysis.overdrawRisk} overlapping alpha meshes.`);
    }

    reports.push(analysis);
  }

  reports.sort((a,b) => a.frame - b.frame);
  
  // Output markdown
  const mdPath = path.join(process.cwd(), 'WebGL_Performance_Report.md');
  let md = '# WebGL Telemetry Audit Report\n\n';
  md += '## Performance Thresholds\n';
  md += `- Startup ready > ${STARTUP_READY_THRESHOLD_MS}ms\n`;
  md += `- Scroll latency p95 > ${SCROLL_P95_THRESHOLD_MS}ms\n`;
  md += `- Scroll frames >33ms > ${SCROLL_OVER_33_THRESHOLD}\n\n`;
  
  reports.forEach(r => {
    md += `### Frame ${r.frame} — Scroll: ${r.progress} (Act ${r.activeAct})\n`;
    md += `- **Draw calls**: ${r.calls}\n`;
    md += `- **Triangles**: ${r.triangles.toLocaleString()}\n`;
    md += `- **Startup ready**: ${r.startupReadyMs ?? 'n/a'}ms\n`;
    md += `- **p95 scroll latency**: ${r.p95ScrollLatencyMs ?? 'n/a'}ms\n`;
    md += `- **Frames over 33ms scroll latency**: ${r.over33ScrollLatencyMs}\n`;
    md += `- **Long tasks**: ${r.longTaskCount}\n`;
    md += `- **Texture memory estimate**: ${r.textureMemoryMB ?? 'n/a'} MB\n`;
    md += `- **Late startup requests**: ${r.lateRequestCount}\n`;
    md += `- **Late staged requests**: entry=${r.lateEntryCriticalCount}, near=${r.lateNearScrollCount}\n`;
    md += `- **Budget violations**: ${
      r.budgetViolations.length > 0 ? r.budgetViolations.join(', ') : 'none'
    }\n`;
    if (r.warnings.length > 0) {
      r.warnings.forEach(w => md += `- ⚠️ **${w}**\n`);
    } else {
      md += `- ✅ Normal parameters\n`;
    }
    md += '\n';
  });

  fs.writeFileSync(mdPath, md);
  console.log(`Generated WebGL Performance Report at ${mdPath}`);
}

analyze();
