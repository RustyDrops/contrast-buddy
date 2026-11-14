export function sampleImageBackgrounds(nodes, dataUrl, viewport) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const scaleX = canvas.width / viewport.width, scaleY = canvas.height / viewport.height;
      for (const node of nodes) {
        if (node.exact) continue;
        const samples = [];
        const foreground = node.foreground.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16));
        for (let row = 0; row < 5; row++) for (let column = 0; column < 7; column++) {
          const x = node.rect.left + (column + .5) / 7 * (node.rect.right - node.rect.left);
          const y = node.rect.top + (row + .5) / 5 * (node.rect.bottom - node.rect.top);
          const px = Math.max(0, Math.min(canvas.width - 1, Math.floor(x * scaleX)));
          const py = Math.max(0, Math.min(canvas.height - 1, Math.floor(y * scaleY)));
          const offset = (py * canvas.width + px) * 4;
          const rgb = [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
          const distance = Math.hypot(rgb[0] - foreground[0], rgb[1] - foreground[1], rgb[2] - foreground[2]);
          if (distance < 22) continue;
          const color = '#' + rgb.map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
          const background = rgb.map(value => {
            value /= 255;
            return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
          }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
          const text = foreground.map(value => {
            value /= 255;
            return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
          }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
          samples.push({ color, ratio: (Math.max(background, text) + .05) / (Math.min(background, text) + .05) });
        }
        if (!samples.length) continue;
        samples.sort((a, b) => a.ratio - b.ratio);
        node.sampledMin = samples[0].ratio;
        node.sampledMedian = samples[Math.floor(samples.length / 2)].ratio;
        node.sampledBackground = samples[0].color;
        node.sampleCount = samples.length;
      }
      resolve();
    };
    image.onerror = () => resolve();
    image.src = dataUrl;
  });
}
