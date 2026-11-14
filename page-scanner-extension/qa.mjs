import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile(new URL('./scanner.mjs', import.meta.url), 'utf8')).replace('export function scanPage()', 'function scanPage()');
const text = value => ({ nodeType: 3, textContent: value });
const makeElement = ({ tagName = 'P', textContent = '', style = {}, rect = { left: 10, top: 10, right: 180, bottom: 40, width: 170, height: 30 }, parentElement = null } = {}) => ({
  tagName, childNodes: textContent ? [text(textContent)] : [], parentElement, nodeType: 1, id: '', className: '',
  getBoundingClientRect: () => rect,
  getAttribute: name => name === 'aria-hidden' ? null : null,
  querySelectorAll: () => [],
  _style: { color: 'rgb(0, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0)', backgroundImage: 'none', opacity: '1', display: 'block', visibility: 'visible', fontSize: '16px', fontWeight: '400', filter: 'none', backdropFilter: 'none', mixBlendMode: 'normal', ...style }
});

const html = makeElement({ tagName: 'HTML', style: { backgroundColor: 'rgb(255, 255, 255)' } });
const body = makeElement({ tagName: 'BODY', parentElement: html });
const passing = makeElement({ textContent: 'Passing sample', style: { color: 'rgb(118, 118, 118)' }, parentElement: body });
const failing = makeElement({ textContent: 'Failing sample', style: { color: 'rgb(119, 119, 119)' }, rect: { left: 10, top: 50, right: 180, bottom: 80, width: 170, height: 30 }, parentElement: body });
const image = makeElement({ tagName: 'H2', textContent: 'Text over image', style: { color: 'rgb(255, 255, 255)', fontSize: '26px', fontWeight: '700', backgroundImage: 'linear-gradient(#000, #333)' }, rect: { left: 10, top: 90, right: 180, bottom: 125, width: 170, height: 35 }, parentElement: body });
body.querySelectorAll = () => [passing, failing, image];
const document = { body, title: 'Scanner test', location: { hostname: 'example.test' }, elementsFromPoint: () => [] };
const getComputedStyle = element => element._style;
const context = { document, location: document.location, getComputedStyle, innerWidth: 360, innerHeight: 600 };
vm.runInNewContext(source, context);
const report = context.scanPage();
assert.equal(report.nodes.length, 3);
assert.equal(report.nodes[0].status, 'pass');
assert.equal(report.nodes[0].required, 4.5);
assert.equal(report.nodes[1].status, 'fail');
assert.equal(report.nodes[1].contrast, 4.478);
assert.equal(report.nodes[2].status, 'review');
assert.equal(report.nodes[2].largeText, true);
assert.equal(report.nodes[2].gradientBackground, true);
assert.equal(report.nodes[2].required, 3);
console.log('PASS: scanner classifies solid pass/fail pairs, large text thresholds, and gradient backgrounds for manual review.');
