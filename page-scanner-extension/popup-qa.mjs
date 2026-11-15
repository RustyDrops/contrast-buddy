import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile(new URL('./popup.mjs', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, '');
const manifest = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url), 'utf8'));
assert.ok(manifest.permissions.includes('clipboardWrite'), 'the scanner can copy detected colors');
class Element {
  constructor() { this.listeners = {}; this.style = {}; this.children = []; this.textContent = ''; this.hidden = false; }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  fire(type) { return this.listeners[type]?.(); }
  replaceChildren() { this.children = []; }
  append(...children) { this.children.push(...children); }
  setAttribute() {}
}
const ids = Object.fromEntries(['scan','report','page-title','counts','scope-note','image-preview','image-preview-wrap','results','status','copy-type-colors'].map(id => [id, new Element()]));
const document = { getElementById: id => ids[id], createElement: () => new Element() };
const node = (typeRole, foreground, extra = {}) => ({ typeRole, foreground, background: '#FFFFFF', contrast: 5, required: 4.5, exact: true, text: 'private page text', selector: 'p', ...extra });
const report = { title: 'Example', host: 'example.test', viewport: { width: 800, height: 600 }, skipped: 0, nodes: [node('header', '#123456'), node('subheader', '#ABCDEF', { translucent: true }), node('body', '#445566')] };
const chrome = { tabs: { query: async () => [{ id: 1, windowId: 2, url: 'https://example.test' }], captureVisibleTab: async () => 'data:image/png;base64,fixture' }, scripting: { executeScript: async () => [{ result: report }] } };
let copied = '';
const navigator = { clipboard: { writeText: async value => { copied = value; } } };
vm.runInNewContext(source, { document, chrome, navigator, scanPage() {}, sampleImageBackgrounds: async () => {} });
await ids.scan.fire('click');
assert.equal(ids['copy-type-colors'].hidden, false);
await ids['copy-type-colors'].fire('click');
assert.deepEqual(JSON.parse(copied), { header: '#123456', body: '#445566' }, 'copies only reliable detected type colors');
assert.doesNotMatch(copied, /private page text/, 'page text is not copied');
assert.match(ids.status.textContent, /Type colors copied/);
console.log('PASS: page scan offers a colors-only import and excludes translucent text.');
