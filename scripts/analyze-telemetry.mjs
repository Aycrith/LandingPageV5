import fs from 'fs';
import path from 'path';

// Define thresholds
const DRAW_CALL_THRESHOLD = 80;
const TRIANGLE_THRESHOLD = 300000;

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
    
    const analysis = {
      frame,
      progress,
      activeAct,
      calls: data.gl.render.calls,
      triangles: data.gl.render.triangles,
      warnings: [],
      overdrawRisk: 0,
      orphanMeshes: 0
    };

    // Check raw GL stats
    if (data.gl.render.calls > DRAW_CALL_THRESHOLD) {
      analysis.warnings.push(`High draw calls: ${data.gl.render.calls}`);
    }
    if (data.gl.render.triangles > TRIANGLE_THRESHOLD) {
      analysis.warnings.push(`High vertex count: ${data.gl.render.triangles.toLocaleString()}`);
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
  md += `- Draw Calls > ${DRAW_CALL_THRESHOLD}\n`;
  md += `- Triangles > ${TRIANGLE_THRESHOLD.toLocaleString()}\n\n`;
  
  reports.forEach(r => {
    md += `### Frame ${r.frame} — Scroll: ${r.progress} (Act ${r.activeAct})\n`;
    md += `- **Draw calls**: ${r.calls}\n`;
    md += `- **Triangles**: ${r.triangles.toLocaleString()}\n`;
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
