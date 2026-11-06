import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import { checkPublic } from '../scripts/check-public.mjs';

test('Publikování zastaví skrytý přístupový údaj i v binárním souboru bez vypsání hodnoty', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'borik-build-test-'));
  try {
    const token = 'fixture/private+token=';
    for (const value of [token, encodeURIComponent(token)]) {
      await writeFile(join(directory, 'image.png'), Buffer.from(`\0binary\0${value}`));
      await assert.rejects(checkPublic(directory, { STEAM_API_KEY: token }), error => {
        assert.doesNotMatch(error.message, /fixture|private/);
        return /publikování je zastavené/.test(error.message);
      });
    }
    await writeFile(join(directory, 'image.png'), 'public content');
    await checkPublic(directory, { STEAM_API_KEY: token });
  } finally {
    if (dirname(resolve(directory)) !== resolve(tmpdir()) || !basename(directory).startsWith('borik-build-test-')) throw new Error('Neplatná cesta fixture.');
    await rm(directory, { recursive: true, force: true });
  }
});
