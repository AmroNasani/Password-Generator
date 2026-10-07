import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const directory = new URL('../ui/icons/', import.meta.url);
const svg = await readFile(new URL('logo.svg', directory), 'utf8');
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({
  ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
  headless: true
});
try {
  const page = await browser.newPage();
  const images = [];
  for (const size of [16, 32, 48, 128, 256]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style>${svg}`);
    const png = await page.screenshot({ omitBackground: true });
    await writeFile(new URL(`icon-${size}.png`, directory), png);
    images.push({ size, png });
  }
  await writeFile(new URL('icon.png', directory), images.at(-1).png);
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = header[entry + 1] = size === 256 ? 0 : size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  await writeFile(new URL('icon.ico', directory), Buffer.concat([header, ...images.map(image => image.png)]));
  console.log('Logo exported as PNG icons and Windows ICO.');
} finally {
  await browser.close();
}
