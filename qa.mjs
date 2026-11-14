import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'page has an inline script');
assert.doesNotMatch(script, /\b(?:localStorage|sessionStorage|fetch|XMLHttpRequest|sendBeacon)\b/, 'colors are not stored or sent');
assert.match(html, /aria-live="polite"/, 'results and errors are announced');
assert.match(html, /@media\(max-width:780px\)/, 'layout has a narrow-screen breakpoint');
assert.match(html, /prefers-reduced-motion:reduce/, 'motion respects the system preference');
assert.match(html, /\[hidden\]\s*\{\s*display:none!important/, 'hidden controls stay hidden despite component styles');
assert.match(html, /<details class="note">/, 'calculation notes can stay collapsed until needed');
assert.match(html, /<option value="4\.5" selected>AA normal/, 'AA normal is the default target');
assert.match(html, /\.unavailable-note\s*\{[^}]*background:/, 'unavailable options have a visible highlight');
assert.match(html, /AAA is optional/, 'AAA is explained as optional');

class Element {
  constructor(id = '') { this.id = id; this.value = ''; this.textContent = ''; this.innerHTML = ''; this.listeners = {}; this.attrs = {}; this.style = {}; this.dataset = {}; this.classList = { values: new Set(), add: x => this.classList.values.add(x), remove: x => this.classList.values.delete(x), toggle: (x, on) => on ? this.classList.values.add(x) : this.classList.values.delete(x), contains: x => this.classList.values.has(x) }; }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  setAttribute(k, v) { this.attrs[k] = v; }
  insertAdjacentHTML(position, html) { this.innerHTML += html; }
  fire(type = 'input', event = {}) { return this.listeners[type]?.(event); }
}
const ids = Object.fromEntries(['foreground','background','foreground-picker','background-picker','foreground-error','background-error','ratio','aa-normal','aa-large','aaa-normal','aaa-large','aa-ui','verdict','preview','recommendation','recommendation-copy','fix-comparison','fix-details','fix-before','fix-after','fix-before-color','fix-after-color','fix-before-ratio','fix-after-ratio','apply-recommendation','copy-suggested','undo-fix','fix-target','css-format','copy-css','reset','toast','swap','copy','explore-options','more-options','aaa-options','view-original','copy-selected','result-source','explore-status','explore-results','explore-target-hint','screen-fg','screen-bg','share-pair','save-pair','clear-board','board-status','board-results','audit-tokens','token-input','token-status','token-results','image-file','image-canvas','image-status','image-samples','type-background','type-header','type-subheader','type-body','type-header-result','type-subheader-result','type-body-result'].map(id => [id, new Element(id)]));
ids.foreground.value = '#24583B'; ids.background.value = '#FFFFFF';
ids['fix-target'].value = '4.5'; ids['css-format'].value = 'declarations';
const document = { getElementById: id => ids[id] };
let copied = '', clipboardFails = false;
const navigator = { clipboard: { async writeText(value) { if (clipboardFails) throw new Error('denied'); copied = value; } } };
class MockURL extends URL { static createObjectURL() { return 'blob:local-test'; } static revokeObjectURL() {} }
class MockImage { naturalWidth = 100; naturalHeight = 50; set src(value) { this.onload?.(); } }
class MockEyeDropper { async open() { return { sRGBHex: '#ABC123' }; } }
ids['image-canvas'].getContext = () => ({ drawImage() {}, getImageData: () => ({ data: [80, 120, 160, 255] }) });
ids['image-canvas'].getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 50 });
const location = { href: 'https://example.test/contrast', hash: '' };
const luminanceOf = hex => hex.match(/[\da-f]{2}/gi).map(channel => parseInt(channel, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126,.7152,.0722][index], 0);
const ratioOf = (a, b) => { const la = luminanceOf(a), lb = luminanceOf(b); return (Math.max(la, lb) + .05) / (Math.min(la, lb) + .05); };
const hslOf = hex => {
  const [r, g, b] = hex.match(/[\da-f]{2}/gi).map(part => parseInt(part, 16) / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, light = (max + min) / 2;
  if (!d) return { hue: 0, saturation: 0 };
  const hue = (max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  return { hue, saturation: d / (1 - Math.abs(2 * light - 1)) };
};
vm.runInNewContext(script, { document, navigator, location, URL: MockURL, URLSearchParams, Image: MockImage, EyeDropper: MockEyeDropper, setTimeout: fn => { fn(); return 1; }, clearTimeout() {} });
assert.equal(ids.ratio.textContent, '8.29');
assert.equal(ids.verdict.textContent, 'AA and AAA pass');
assert.equal(ids['aaa-normal'].textContent, '✓ Pass');
assert.equal(ids['explore-target-hint'].textContent, 'For AA normal text');
assert.ok(html.indexOf('Runs privately in your browser') < html.indexOf('id="screen-fg"') && html.indexOf('id="screen-bg"') < html.indexOf('<header>'), 'screen picker controls sit beneath the privacy notice');
ids['type-header'].value = '#777777'; ids['type-header'].fire('input');
assert.match(ids['type-header-result'].textContent, /4\.48:1 · AA normal needs work · AA large pass/);
ids['type-subheader'].value = '#000'; ids['type-subheader'].fire('input');
assert.match(ids['type-subheader-result'].textContent, /21\.00:1 · AA normal pass/);
ids['type-body'].value = 'not a color'; ids['type-body'].fire('input');
assert.equal(ids['type-body'].attrs['aria-invalid'], 'true');
assert.match(ids['type-body-result'].textContent, /Enter a 3- or 6-digit/);
ids['type-body'].value = ''; ids['type-body'].fire('input'); assert.equal(ids['type-body-result'].textContent, 'Optional');
ids.background.value = 'invalid'; ids.background.fire();
assert.match(ids['type-header-result'].textContent, /valid background/);
ids.background.value = '#FFFFFF'; ids.background.fire();
ids['fix-target'].value = '7'; ids['fix-target'].fire('change');
ids['explore-options'].fire('click');
const initialSuggestions = [...ids['explore-results'].innerHTML.matchAll(/data-color="(#[0-9A-F]{6})"[^>]*aria-label="[^"]+: use #[0-9A-F]{6} text on #[0-9A-F]{6}, contrast ([0-9.]+) to 1" data-background="(#[0-9A-F]{6})"/g)];
assert.ok(initialSuggestions.length >= 2, 'exploration returns multiple options');
for (const [, color, ratio, background] of initialSuggestions) {
  assert.ok(Number(ratio) >= 7);
  assert.ok(ratioOf(color, background) >= 7);
}
const firstOption = initialSuggestions[0][1];
const choose = (color, background) => ids['explore-results'].fire('click', { target: { closest: () => ({ dataset: { color, background }, setAttribute() {} }) } });
const savedOptions = ids['explore-results'].innerHTML;
choose(firstOption, initialSuggestions[0][3]);
assert.equal(ids.foreground.value, '#24583B');
assert.equal(ids['type-background'].textContent, `Against background ${initialSuggestions[0][3]}`);
assert.equal(ids['explore-results'].innerHTML, savedOptions, 'choosing an option keeps the list available');
assert.equal(ids.preview.style.color, firstOption);
assert.equal(ids['view-original'].hidden, false);
ids['view-original'].fire('click');
assert.equal(ids.foreground.value, '#24583B');
assert.equal(ids['type-background'].textContent, 'Against background #FFFFFF');

ids.foreground.value = '#567F69'; ids.background.value = '#806060'; ids.foreground.fire();
ids['explore-options'].fire('click');
const aaaOptions = [...ids['explore-results'].innerHTML.matchAll(/data-color="(#[0-9A-F]{6})"[^>]*aria-label="[^"]+: use #[0-9A-F]{6} text on #[0-9A-F]{6}, contrast ([0-9.]+) to 1" data-background="(#[0-9A-F]{6})"/g)];
assert.ok(aaaOptions.length > 0, 'AAA offers at least one passing pair');
for (const [, color, , background] of aaaOptions) {
  assert.ok(ratioOf(color, background) >= 7, 'every available suggestion meets AAA normal');
  choose(color, background);
  assert.equal(ids['aaa-normal'].textContent, '✓ Pass');
  assert.equal(ids.foreground.value, '#567F69'); assert.equal(ids.background.value, '#806060');
}
ids['fix-target'].value = '4.5'; ids['fix-target'].fire('change');
ids['explore-options'].fire('click');
assert.match(ids['explore-status'].textContent, /AAA may fail/);
const exampleOptions = [...ids['explore-results'].innerHTML.matchAll(/data-color="(#[0-9A-F]{6})"[^>]*aria-label="[^"]+: use #[0-9A-F]{6} text on #[0-9A-F]{6}, contrast ([0-9.]+) to 1" data-background="(#[0-9A-F]{6})"/g)];
assert.equal(exampleOptions.length, 3);
assert.notEqual(exampleOptions[0][1], '#567F69'); assert.equal(exampleOptions[0][3], '#806060');
assert.equal(exampleOptions[1][1], '#567F69'); assert.notEqual(exampleOptions[1][3], '#806060');
assert.notEqual(exampleOptions[2][1], '#567F69'); assert.notEqual(exampleOptions[2][3], '#806060');
for (const [, color, , background] of exampleOptions) assert.ok(ratioOf(color, background) >= 4.5);
const optionList = ids['explore-results'].innerHTML;
for (const [, color, , background] of exampleOptions) {
  choose(color, background);
  assert.equal(ids.foreground.value, '#567F69'); assert.equal(ids.background.value, '#806060');
  assert.equal(ids.preview.style.color, color); assert.equal(ids.preview.style.backgroundColor, background);
  assert.equal(ids['explore-results'].innerHTML, optionList);
}
await ids['copy-selected'].fire('click');
assert.equal(copied, `Text: ${exampleOptions[2][1]}\nBackground: ${exampleOptions[2][3]}`);
choose(exampleOptions[2][1], exampleOptions[2][3]);
assert.equal(ids.preview.style.backgroundColor, exampleOptions[2][3]);
assert.equal(ids['type-background'].textContent, `Against background ${exampleOptions[2][3]}`);
assert.ok(ids['type-header-result'].textContent.startsWith(`${ratioOf('#777777', exampleOptions[2][3]).toFixed(2)}:1`));
ids['view-original'].fire('click');
assert.equal(ids.foreground.value, '#567F69'); assert.equal(ids.background.value, '#806060');
const firstSet = ids['explore-results'].innerHTML;
choose(exampleOptions[0][1], exampleOptions[0][3]);
ids['more-options'].fire('click');
assert.ok(ids['explore-results'].innerHTML.startsWith(firstSet), 'more options keeps existing cards');
assert.equal([...ids['explore-results'].innerHTML.matchAll(/data-color="#[0-9A-F]{6}"/g)].length, 6, 'three new cards are appended');
assert.equal(ids.preview.style.color, exampleOptions[0][1], 'appending keeps the selected preview');
ids['more-options'].fire('click');
assert.equal([...ids['explore-results'].innerHTML.matchAll(/data-color="#[0-9A-F]{6}"/g)].length, 9, 'a second request appends three more cards');
for (const [, color, , background] of ids['explore-results'].innerHTML.matchAll(/data-color="(#[0-9A-F]{6})"[^>]*aria-label="[^"]+: use #[0-9A-F]{6} text on #[0-9A-F]{6}, contrast ([0-9.]+) to 1" data-background="(#[0-9A-F]{6})"/g)) assert.ok(ratioOf(color, background) >= 4.5);
ids['aaa-options'].fire('click');
assert.equal(ids['fix-target'].value, '7');
assert.match(ids['explore-status'].textContent, /AAA normal/);
ids['fix-target'].value = '4.5'; ids['fix-target'].fire('change');

ids.foreground.value = '#000'; ids.background.value = '#fff'; ids.foreground.fire();
assert.equal(ids.ratio.textContent, '21.00');
assert.equal(ids.preview.style.color, '#000000');
assert.equal(ids.foreground.value, '#000');
assert.equal(ids['foreground-picker'].value, '#000000');
ids.foreground.value = '#767676'; ids.foreground.fire();
assert.equal(ids['aa-normal'].textContent, '✓ Pass');
ids.foreground.value = '#777777'; ids.foreground.fire();
assert.equal(ids['aa-normal'].textContent, '✕ Needs work');
assert.equal(ids['aa-large'].textContent, '✓ Pass');
assert.equal(ids.verdict.textContent, 'Large text and UI pass');
assert.equal(ids['aa-ui'].textContent, '✓ Pass');
assert.equal(ids.verdict.classList.contains('warn'), true);
assert.equal(ids.recommendation.hidden, false);
assert.match(ids['recommendation-copy'].textContent, /Suggested: #767676/);
assert.equal(ids['fix-before'].style.color, '#777777');
assert.equal(ids['fix-after'].style.color, '#767676');
assert.match(ids['fix-before-ratio'].textContent, /4\.48:1/);
assert.match(ids['fix-after-ratio'].textContent, /4\.5[0-9]:1/);
ids['fix-target'].value = '3'; ids['fix-target'].fire('change');
assert.equal(ids.recommendation.hidden, true, 'a pair that already passes the selected 3:1 target needs no fix');
ids['fix-target'].value = '4.5'; ids['fix-target'].fire('change');
ids['apply-recommendation'].fire('click', { currentTarget: ids['apply-recommendation'] });
assert.equal(ids.foreground.value, '#767676');
assert.equal(ids['aa-normal'].textContent, '✓ Pass');
assert.equal(ids.preview.style.color, '#767676');
assert.equal(ids.recommendation.hidden, true);
assert.equal(ids['undo-fix'].hidden, false);
ids['undo-fix'].fire('click');
assert.equal(ids.foreground.value, '#777777');
assert.equal(ids['undo-fix'].hidden, true);
ids['fix-target'].value = '7'; ids['fix-target'].fire('change');
assert.equal(ids.recommendation.hidden, false, 'AAA target offers a fix even when AA already passes');
assert.match(ids['recommendation-copy'].textContent, /AAA normal text/);
assert.ok(ratioOf(ids['apply-recommendation'].dataset.color, '#FFFFFF') >= 7);
ids['copy-suggested'].fire('click');
assert.match(copied, /color: #[0-9A-F]{6};\nbackground-color: #FFFFFF;/);
ids['css-format'].value = 'variables'; ids['copy-css'].fire('click');
assert.match(copied, /--text-color: #777777;/);
assert.match(copied, /--background-color: #FFFFFF;/);
ids['background'].value = '#777777'; ids['foreground'].value = '#777777'; ids.foreground.fire();
assert.match(ids['recommendation-copy'].textContent, /Text alone cannot reach 7:1/);
assert.equal(ids['recommendation-copy'].classList.contains('unavailable-note'), true);
assert.equal(ids['apply-recommendation'].hidden, true);
ids['explore-options'].fire('click');
assert.match(ids['explore-results'].innerHTML, /Text only<\/span><span class="option-meta unavailable-note">Not possible at 7:1/);
assert.match(ids['explore-results'].innerHTML, /Background only<\/span><span class="option-meta unavailable-note">Not possible at 7:1/);
assert.match(ids['explore-results'].innerHTML, /Both colors/);
ids['fix-target'].value = '3'; ids['fix-target'].fire('change');
assert.equal(ids['recommendation-copy'].classList.contains('unavailable-note'), false);
assert.equal(ids.recommendation.hidden, false, 'a failing 3:1 target gets a text adjustment');
assert.ok(ratioOf(ids['apply-recommendation'].dataset.color, '#777777') >= 3);
ids['apply-recommendation'].fire('click', { currentTarget: ids['apply-recommendation'] });
assert.equal(ids['aa-large'].textContent, '✓ Pass');
assert.equal(ids['aa-ui'].textContent, '✓ Pass');
ids['undo-fix'].fire('click');
assert.equal(ids.foreground.value, '#777777');
ids['reset'].fire('click');
assert.equal(ids.foreground.value, '#24583B');
assert.equal(ids.background.value, '#FFFFFF');
assert.equal(ids['fix-target'].value, '4.5');
assert.equal(ids['css-format'].value, 'declarations');
ids['fix-target'].value = '4.5'; ids['fix-target'].fire('change');
ids.foreground.value = '#949494'; ids.foreground.fire();
assert.equal(ids['aa-large'].textContent, '✓ Pass');
assert.equal(ids['aa-ui'].textContent, '✓ Pass');
ids.foreground.value = '#959595'; ids.foreground.fire();
assert.equal(ids['aa-large'].textContent, '✕ Needs work');
assert.equal(ids['aa-ui'].textContent, '✕ Needs work');
ids.foreground.value = '#595959'; ids.foreground.fire();
assert.equal(ids['aaa-normal'].textContent, '✓ Pass');
ids.foreground.value = '#5A5A5A'; ids.foreground.fire();
assert.equal(ids['aaa-normal'].textContent, '✕ Needs work');
assert.equal(ids['aa-normal'].textContent, '✓ Pass');
ids.foreground.value = '#888888'; ids.background.value = '#777777'; ids.foreground.fire();
assert.equal(ids.verdict.textContent, 'Below AA contrast');
assert.equal(ids.verdict.classList.contains('fail'), true);
assert.equal(ids['aa-ui'].textContent, '✕ Needs work');
assert.equal(ids.recommendation.hidden, false);
const suggestedColor = ids['apply-recommendation'].dataset.color;
assert.ok(ratioOf(suggestedColor, '#777777') >= 4.5, 'the proposed adjustment itself reaches AA');
ids.foreground.value = 'not-hex'; ids.foreground.fire();
assert.equal(ids['foreground-error'].textContent, 'Enter a 3- or 6-digit HEX color.');
assert.equal(ids.foreground.attrs['aria-invalid'], 'true');
assert.equal(ids.ratio.textContent, '—', 'invalid input clears the previous result');
assert.equal(ids['aa-normal'].textContent, '—');
assert.equal(ids['aa-ui'].textContent, '—');
assert.equal(ids.verdict.textContent, 'Enter valid colors');
assert.equal(ids.preview.style.color, '');
assert.equal(ids.recommendation.hidden, true);
ids.foreground.value = '#123456'; ids.background.value = '#ABCDEF'; ids.swap.fire('click');
assert.equal(ids.foreground.value, '#ABCDEF'); assert.equal(ids.background.value, '#123456');
await ids.copy.fire('click');
assert.equal(copied, 'Text: #ABCDEF\nBackground: #123456');
clipboardFails = true;
await ids.copy.fire('click');
assert.equal(ids.toast.textContent, 'Clipboard unavailable in this browser');
clipboardFails = false;

ids.background.value = '#FFFFFF'; ids.foreground.value = '';
for (const character of '#123456') { ids.foreground.value += character; ids.foreground.fire('input'); }
assert.equal(ids.foreground.value, '#123456', 'typing a six-digit HEX value character by character is not rewritten as shorthand');
assert.equal(ids['aa-normal'].textContent, '✓ Pass');
ids.foreground.fire('blur');
assert.equal(ids.foreground.value, '#123456');

let seed = 20261113;
const randomHex = () => { seed = (1664525 * seed + 1013904223) >>> 0; return '#' + (seed & 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase(); };
for (let i = 0; i < 250; i++) {
  const foreground = randomHex(), background = randomHex();
  ids.foreground.value = foreground; ids.background.value = background; ids.foreground.fire();
  if (ratioOf(foreground, background) < 4.5) {
    const suggestion = ids['apply-recommendation'].dataset.color;
    assert.equal(ids.recommendation.hidden, false, `a failing pair gets a recommendation (${foreground} on ${background})`);
    assert.ok(ratioOf(suggestion, background) >= 4.5, `recommendation passes AA (${suggestion} on ${background})`);
  } else assert.equal(ids.recommendation.hidden, true, 'passing pairs do not show a fix suggestion');
}
for (let i = 0; i < 40; i++) {
  const foreground = randomHex(), background = randomHex();
  for (const target of ['3', '4.5', '7']) {
    ids.foreground.value = foreground; ids.background.value = background; ids.foreground.fire();
    ids['fix-target'].value = target; ids['fix-target'].fire('change');
    ids['explore-options'].fire('click');
    const options = [...ids['explore-results'].innerHTML.matchAll(/data-color="(#[0-9A-F]{6})"[^>]*aria-label="[^"]+: use #[0-9A-F]{6} text on #[0-9A-F]{6}, contrast ([0-9.]+) to 1" data-background="(#[0-9A-F]{6})"/g)];
    if (target !== '7') assert.ok(options.length > 0, `Explore finds at least one option for ${target}:1 (${foreground} on ${background})`);
    for (const [, color, , optionBackground] of options) assert.ok(ratioOf(color, optionBackground) >= Number(target), `Explore option passes ${target}:1 (${color} on ${optionBackground})`);
    ids['more-options'].fire('click');
    const more = [...ids['explore-results'].innerHTML.matchAll(/data-color="(#[0-9A-F]{6})"[^>]*aria-label="[^"]+: use #[0-9A-F]{6} text on #[0-9A-F]{6}, contrast ([0-9.]+) to 1" data-background="(#[0-9A-F]{6})"/g)];
    for (const [, color, , optionBackground] of more) assert.ok(ratioOf(color, optionBackground) >= Number(target), `Alternate option passes ${target}:1 (${color} on ${optionBackground})`);
  }
}
ids.foreground.value = '#B4D9C5'; ids.background.value = '#FFFFFF'; ids.foreground.fire();
ids['fix-target'].value = '7'; ids['fix-target'].fire('change'); ids['explore-options'].fire('click');
const cardPattern = /data-color="(#[0-9A-F]{6})"[^>]*aria-label="([^"]+): use #[0-9A-F]{6} text on #[0-9A-F]{6}, contrast ([0-9.]+) to 1" data-background="(#[0-9A-F]{6})"/g;
const baseCards = [...ids['explore-results'].innerHTML.matchAll(cardPattern)];
ids['more-options'].fire('click');
const allCards = [...ids['explore-results'].innerHTML.matchAll(cardPattern)];
const added = allCards.slice(baseCards.length);
assert.equal(added.length, 3, 'more options appends three cards for the screenshot colors');
assert.equal(added[0][4], '#FFFFFF', 'text-only keeps the original background');
assert.equal(added[1][1], '#B4D9C5', 'background-only keeps the original text');
const hueDistance = Math.abs(hslOf(baseCards[0][1]).hue - hslOf(added[0][1]).hue);
assert.ok(Math.min(hueDistance, 360 - hueDistance) >= 20 && Math.min(hueDistance, 360 - hueDistance) <= 50, 'additional text-only option has a moderate hue shift');
assert.ok(hslOf(added[1][4]).saturation >= .15, 'additional background-only option has a subtle color tint');
for (const [, fg, , , bg] of added) assert.ok(ratioOf(fg, bg) >= 7, 'diverse options still pass AAA');
ids.foreground.value = '#AEC6B9'; ids.background.value = '#FFFFFF'; ids.foreground.fire();
ids['fix-target'].value = '4.5'; ids['fix-target'].fire('change'); ids['explore-options'].fire('click');
for (let i = 0; i < 4; i++) ids['more-options'].fire('click');
const bothCards = [...ids['explore-results'].innerHTML.matchAll(cardPattern)].filter(card => card[2] === 'Both colors');
assert.ok(bothCards.length >= 3, 'multiple two-color alternatives are available');
for (const [, fg, , , bg] of bothCards) {
  assert.ok(luminanceOf(bg) >= .8, `white-background design stays light: ${bg}`);
  assert.ok(luminanceOf(fg) < luminanceOf(bg), 'original dark-text/light-background polarity is retained');
  assert.ok(ratioOf(fg, bg) >= 4.5, 'two-color alternative passes AA');
}
ids.foreground.value = '#708080'; ids.background.value = '#101820'; ids.foreground.fire(); ids['explore-options'].fire('click');
const darkBoth = [...ids['explore-results'].innerHTML.matchAll(cardPattern)].find(card => card[2] === 'Both colors');
assert.ok(darkBoth, 'a two-color option exists for a dark design');
assert.ok(luminanceOf(darkBoth[4]) < .12, 'dark-background design stays dark');
assert.ok(luminanceOf(darkBoth[1]) > luminanceOf(darkBoth[4]), 'original light-text/dark-background polarity is retained');
assert.ok(ratioOf(darkBoth[1], darkBoth[4]) >= 4.5);
assert.ok(html.indexOf('id="preview"') < html.indexOf('id="ratio-status"'), 'preview appears above the readability score');
assert.equal(ids['screen-fg'].hidden, false);
await ids['screen-fg'].fire('click');
assert.equal(ids.foreground.value, '#ABC123', 'screen picker updates the chosen input');
ids.foreground.value = '#000000'; ids.background.value = '#FFFFFF'; ids.foreground.fire();
ids['fix-target'].value = '4.5'; ids['fix-target'].fire('change');
await ids['share-pair'].fire('click');
const shared = new URL(copied), sharedParams = new URLSearchParams(shared.hash.slice(1));
assert.equal(sharedParams.get('fg'), '#000000'); assert.equal(sharedParams.get('bg'), '#FFFFFF'); assert.equal(sharedParams.get('target'), '4.5');
const restoredIds = Object.fromEntries(Object.keys(ids).map(id => [id, new Element(id)]));
restoredIds.foreground.value = '#24583B'; restoredIds.background.value = '#FFFFFF'; restoredIds['fix-target'].value = '7'; restoredIds['css-format'].value = 'declarations';
const restoredDocument = { getElementById: id => restoredIds[id] };
vm.runInNewContext(script, { document: restoredDocument, navigator, location: { href: shared.href, hash: shared.hash }, URL: MockURL, URLSearchParams, Image: MockImage, setTimeout: fn => { fn(); return 1; }, clearTimeout() {} });
assert.equal(restoredIds.foreground.value, '#000000'); assert.equal(restoredIds.background.value, '#FFFFFF'); assert.equal(restoredIds['fix-target'].value, '4.5');
ids['save-pair'].fire('click');
assert.match(ids['board-results'].innerHTML, /#000000 \/ #FFFFFF/);
ids['save-pair'].fire('click'); assert.match(ids['board-status'].textContent, /already saved/);
ids['board-results'].fire('click', { target: { closest: () => ({ dataset: { index: '0' } }) } });
assert.equal(ids.preview.style.color, '#000000');
ids['clear-board'].fire('click'); assert.equal(ids['board-results'].innerHTML, '');
for (let i = 1; i <= 6; i++) { ids.foreground.value = `#00000${i}`; ids.foreground.fire(); ids['save-pair'].fire('click'); }
ids.foreground.value = '#000007'; ids.foreground.fire(); ids['save-pair'].fire('click');
assert.match(ids['board-status'].textContent, /Board is full/);
ids['clear-board'].fire('click');
ids['token-input'].value = '--text: #000; --surface: #fff; --muted: #777777;'; ids['audit-tokens'].fire('click');
assert.match(ids['token-status'].textContent, /3 colors · 6 ordered pairs/);
assert.match(ids['token-results'].innerHTML, /#000000 on #FFFFFF · 21\.00:1 Pass/);
ids['token-results'].fire('click', { target: { closest: () => ({ dataset: { fg: '#777777', bg: '#FFFFFF' } }) } });
assert.equal(ids.preview.style.color, '#777777'); assert.equal(ids['aa-normal'].textContent, '✕ Needs work');
await ids['share-pair'].fire('click');
assert.equal(new URLSearchParams(new URL(copied).hash.slice(1)).get('fg'), '#777777', 'sharing uses the selected preview');
ids['token-input'].value = 'not colors'; ids['audit-tokens'].fire('click'); assert.match(ids['token-status'].textContent, /at least two/);
ids['token-input'].value = Array.from({ length: 13 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`).join(' '); ids['audit-tokens'].fire('click'); assert.match(ids['token-status'].textContent, /12 or fewer/);
ids['image-file'].fire('change', { currentTarget: { files: [{ type: 'image/png' }] } });
assert.equal(ids['image-canvas'].hidden, false);
ids['image-canvas'].fire('click', { clientX: 25, clientY: 20 });
assert.match(ids['image-samples'].innerHTML, /#5078A0/);
ids['image-samples'].fire('click', { target: { closest: () => ({ dataset: { color: '#5078A0' } }) } });
assert.equal(ids.background.value, '#5078A0');
ids['image-canvas'].fire('keydown', { key: 'ArrowRight', preventDefault() {} });
ids['image-canvas'].fire('keydown', { key: 'Enter', preventDefault() {} });
assert.match(ids['image-status'].textContent, /Sampled #5078A0/);
console.log('PASS: contrast, appended options, screen picking, share-link round trip, session board, token audit, image sampling, preview order, and existing actions.');
