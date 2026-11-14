import { scanPage } from './scanner.mjs';
import { sampleImageBackgrounds } from './pixel-sampler.mjs';

const $ = id => document.getElementById(id);
const button = $('scan');

function render(report, screenshot) {
  $('report').hidden = false;
  $('page-title').textContent = `${report.title} · ${report.host}`;
  $('counts').textContent = `${report.nodes.length} visible text samples · ${report.viewport.width} × ${report.viewport.height} viewport · ${report.skipped} unsupported styles skipped`;
  $('scope-note').textContent = 'This scan covers the visible main frame only. Embedded cross-origin frames and content outside the viewport are not included.';
  $('image-preview').src = screenshot;
  $('image-preview-wrap').hidden = false;

  const results = $('results');
  results.replaceChildren();
  const rows = report.nodes.map(node => {
    const result = { ...node };
    if (node.exact) {
      result.status = node.contrast >= node.required ? 'pass' : 'fail';
      result.badge = result.status === 'pass' ? 'Pass' : 'Fail';
      result.ratioLabel = `${node.contrast.toFixed(2)}:1`;
      result.background = node.background;
    } else if (node.sampledMin != null) {
      result.status = node.sampledMin < node.required ? 'fail' : 'review';
      result.badge = node.sampledMin < node.required ? 'Possible fail' : 'Review image';
      result.ratioLabel = `≈${node.sampledMin.toFixed(2)}:1 worst sample · ${node.sampleCount} points`;
      result.background = node.sampledBackground;
    } else {
      result.status = 'review'; result.badge = 'Visual review'; result.ratioLabel = 'No reliable pixel sample';
    }
    return result;
  });
  const order = { fail: 0, review: 1, pass: 2 };
  rows.sort((a, b) => order[a.status] - order[b.status]);

  const shown = rows.slice(0, 45);
  for (const row of shown) {
    const card = document.createElement('article'); card.className = 'result';
    const top = document.createElement('div'); top.className = 'result-top';
    const sample = document.createElement('span'); sample.className = 'sample'; sample.textContent = row.text || row.selector;
    const badge = document.createElement('span'); badge.className = `badge ${row.status}`; badge.textContent = row.badge;
    top.append(sample, badge);
    const pair = document.createElement('div'); pair.className = 'pair';
    const fgChip = document.createElement('span'); fgChip.className = 'chip'; fgChip.style.backgroundColor = row.foreground; fgChip.setAttribute('aria-label', `Text ${row.foreground}`);
    const bgChip = document.createElement('span'); bgChip.className = 'chip'; bgChip.style.backgroundColor = row.background; bgChip.setAttribute('aria-label', `Sampled background ${row.background}`);
    const colors = document.createElement('span'); colors.textContent = `${row.foreground} on ${row.background}`;
    pair.append(fgChip, bgChip, colors);
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = `${row.ratioLabel} · needs ${row.required}:1${row.largeText ? ' · large text' : ' · normal text'} · ${row.selector}`;
    card.append(top, pair, meta); results.append(card);
  }
  const statusCounts = rows.reduce((counts, row) => { counts[row.status]++; return counts; }, { pass: 0, fail: 0, review: 0 });
  $('counts').textContent += ` · ${statusCounts.fail} fail, ${statusCounts.review} visual review, ${statusCounts.pass} pass`;
  if (rows.length > shown.length) {
    const more = document.createElement('p'); more.className = 'footnote'; more.textContent = `${rows.length - shown.length} more samples not shown. Narrow the page or inspect the page in sections.`; results.append(more);
  }
  $('status').textContent = 'Scan complete. Image/gradient results are estimates, not conformance findings.';
}

button.addEventListener('click', async () => {
  button.disabled = true; $('status').textContent = 'Scanning the visible page…'; $('report').hidden = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/.test(tab.url || '')) throw new Error('Open a regular webpage (http or https) before scanning.');
    const [execution] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scanPage });
    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    const report = execution?.result;
    if (!report) throw new Error('The page did not return scan results.');
    await sampleImageBackgrounds(report.nodes, screenshot, report.viewport);
    render(report, screenshot);
  } catch (error) {
    $('status').textContent = error?.message || 'The page could not be scanned. Try another tab.';
  } finally { button.disabled = false; }
});
