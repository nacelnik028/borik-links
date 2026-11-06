// Kontroluje jen shodu v paměti. Nikdy nevypisuje hodnotu ani nalezený obsah.
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function checkPublic(directory, environment = process.env) {
  const secrets = Object.entries(environment).filter(([name, value]) => /SECRET|TOKEN|API_KEY|CLIENT_ID/.test(name)
    && typeof value === 'string' && value.length >= 8).flatMap(([, value]) => [value, encodeURIComponent(value)]).map(value => Buffer.from(value));
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const file = resolve(path, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) {
        const data = await readFile(file);
        if (secrets.some(secret => data.includes(secret))) throw new Error('Veřejné soubory obsahují přístupový údaj; publikování je zastavené.');
      }
    }
  }
  await walk(directory);
}
