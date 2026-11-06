// Publikuje jen veřejné soubory; přístupové údaje a serverový kód zůstávají mimo dist.
import { cp, mkdir, rm, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { basename, dirname, resolve, extname } from 'node:path';
import { checkPublic } from './check-public.mjs';

const root = new URL('../', import.meta.url);
const rootPath = resolve(fileURLToPath(root));
const output = resolve(rootPath, 'dist');
if (dirname(output) !== rootPath || basename(output) !== 'dist') {
  throw new Error('Neplatný výstupní adresář.');
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const path of ['index.html', 'config.js']) await cp(new URL(path, root), resolve(output, path));
async function copyPublic(directory, extensions) {
  for (const entry of await readdir(new URL(`${directory}/`, root), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await copyPublic(path, extensions);
    else if (entry.isFile() && extensions.includes(extname(entry.name).toLowerCase())) {
      await mkdir(dirname(resolve(output, path)), { recursive: true });
      await cp(new URL(path, root), resolve(output, path));
    }
  }
}
await copyPublic('css', ['.css']);
await copyPublic('js', ['.js']);
await copyPublic('assets', ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg', '.ico', '.woff', '.woff2']);
await checkPublic(output);
console.log('Veřejné soubory jsou připravené v dist.');
