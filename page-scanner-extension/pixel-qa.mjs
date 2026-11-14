import assert from 'node:assert/strict';
import { sampleImageBackgrounds } from './pixel-sampler.mjs';

const width = 140, height = 100;
const rgba = new Uint8ClampedArray(width * height * 4);
for (let index = 0; index < rgba.length; index += 4) { rgba[index] = 119; rgba[index + 1] = 119; rgba[index + 2] = 119; rgba[index + 3] = 255; }
globalThis.document = { createElement: () => ({
  width: 0, height: 0,
  getContext: () => ({ drawImage() {}, getImageData: () => ({ data: rgba }) })
}) };
globalThis.Image = class {
  naturalWidth = width; naturalHeight = height;
  set src(value) { this._src = value; queueMicrotask(() => this.onload?.()); }
};
const nodes = [
  { foreground: '#FFFFFF', exact: false, rect: { left: 4, top: 5, right: 60, bottom: 40 } },
  { foreground: '#000000', exact: false, rect: { left: 4, top: 5, right: 60, bottom: 40 } },
  { foreground: '#FFFFFF', exact: true, rect: { left: 4, top: 5, right: 60, bottom: 40 } }
];
await sampleImageBackgrounds(nodes, 'data:image/png;base64,local-test', { width: 70, height: 50 });
assert.equal(nodes[0].sampledBackground, '#777777');
assert.ok(Math.abs(nodes[0].sampledMin - 4.478) < .002, 'screenshot pixels produce a stable failing contrast estimate');
assert.ok(nodes[1].sampledMin > 4.5, 'contrast estimate also handles dark text');
assert.equal(nodes[2].sampleCount, undefined, 'opaque solid-color results skip screenshot sampling');
console.log('PASS: screenshot-background sampling, ratio estimates, and solid-color fast path.');
