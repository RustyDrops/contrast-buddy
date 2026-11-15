export function scanPage() {
  const parseColor = value => {
    const parts = String(value).match(/[\d.]+/g);
    if (!parts || parts.length < 3) return null;
    const modern = String(value).includes('color(');
    const rgb = parts.slice(0, 3).map(part => {
      const number = Number(part);
      return modern && number <= 1 ? Math.round(number * 255) : Math.round(number);
    });
    const alpha = parts.length > 3 ? Number(parts[3]) : 1;
    return { rgb, alpha };
  };
  const toHex = rgb => '#' + rgb.map(value => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')).join('').toUpperCase();
  const luminance = color => color.map(value => {
    value /= 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  const ratio = (foreground, background) => {
    const a = luminance(foreground), b = luminance(background);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  };
  const isVisible = (element, rect, style) => style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
  const nodes = [];
  const body = document.body;
  if (!body) return { title: document.title || location.hostname, host: location.hostname, viewport: { width: innerWidth, height: innerHeight }, nodes: [], skipped: 0 };
  const elements = [body, ...body.querySelectorAll('*')];
  let skipped = 0;
  for (const element of elements) {
    const text = Array.from(element.childNodes || []).filter(node => node.nodeType === 3).map(node => node.textContent.trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ');
    if (!text || element.getAttribute?.('aria-hidden') === 'true') continue;
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    if (!isVisible(element, rect, style)) continue;
    const foreground = parseColor(style.color);
    if (!foreground) { skipped++; continue; }
    let background = null, imageBackground = false, gradientBackground = false, translucent = foreground.alpha < .99, filtered = false;
    for (let current = element; current && current.nodeType === 1; current = current.parentElement) {
      const currentStyle = getComputedStyle(current);
      if (currentStyle.backgroundImage && currentStyle.backgroundImage !== 'none') {
        imageBackground = true;
        if (/gradient\(/i.test(currentStyle.backgroundImage)) gradientBackground = true;
      }
      if (currentStyle.filter && currentStyle.filter !== 'none' || currentStyle.backdropFilter && currentStyle.backdropFilter !== 'none' || currentStyle.mixBlendMode && currentStyle.mixBlendMode !== 'normal') filtered = true;
      if (Number(currentStyle.opacity) < .99) translucent = true;
      const color = parseColor(currentStyle.backgroundColor);
      if (color?.alpha >= .99) { background = color; break; }
      if (color?.alpha > 0) translucent = true;
    }
    const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
    const hitStack = document.elementsFromPoint?.(centerX, centerY) || [];
    if (hitStack.some(hit => /^(IMG|VIDEO|CANVAS|SVG)$/i.test(hit.tagName || ''))) imageBackground = true;
    background ||= { rgb: [255, 255, 255], alpha: 1 };
    const size = parseFloat(style.fontSize) || 16, weight = Number.parseInt(style.fontWeight, 10) || (style.fontWeight === 'bold' ? 700 : 400);
    const largeText = size >= 24 || size >= 18.67 && weight >= 700;
    const required = largeText ? 3 : 4.5;
    const contrast = ratio(foreground.rgb, background.rgb);
    const selector = element.id ? `#${element.id}` : element.tagName.toLowerCase() + (typeof element.className === 'string' && element.className.trim() ? '.' + element.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    const heading = element.closest?.('h1, h2, h3, p') || (/^(H1|H2|H3|P)$/i.test(element.tagName) ? element : null);
    const typeRole = heading?.tagName === 'H1' ? 'header' : /^(H2|H3)$/.test(heading?.tagName || '') ? 'subheader' : heading?.tagName === 'P' ? 'body' : null;
    nodes.push({
      text: text.slice(0, 120), selector, foreground: toHex(foreground.rgb), background: toHex(background.rgb), contrast: Number(contrast.toFixed(3)), required,
      largeText, imageBackground, gradientBackground, translucent, filtered, typeRole,
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      exact: !imageBackground && !translucent && !filtered,
      status: !imageBackground && !translucent && !filtered ? contrast >= required ? 'pass' : 'fail' : 'review'
    });
    if (nodes.length >= 120) break;
  }
  return { title: document.title || location.hostname, host: location.hostname, viewport: { width: innerWidth, height: innerHeight }, nodes, skipped };
}
