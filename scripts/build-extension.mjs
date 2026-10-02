import { mkdir, readdir, readFile, writeFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { zipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist/chrome-extension');
await mkdir(output, { recursive: true });
await cp(path.join(root, 'ui'), output, { recursive: true });
await cp(path.join(root, 'extension/manifest.json'), path.join(output, 'manifest.json'));
const files = {};
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) await collect(path.join(directory, entry.name), name + '/');
    else files[name] = await readFile(path.join(directory, entry.name));
  }
}
await collect(output);
await writeFile(path.join(root, 'dist/Password-Generator-Chrome.zip'), zipSync(files));
console.log('Chrome-Erweiterung: dist/chrome-extension und dist/Password-Generator-Chrome.zip');
