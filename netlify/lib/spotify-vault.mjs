// Pouze server. Rotované tokeny a trvalé odmítnutí přežijí restart funkce.
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { getStore } from '@netlify/blobs';
import { SourceError } from './response.mjs';

export function memoryStore() {
  const entries = new Map();
  return { async get(key) { return entries.get(key) || null; }, async set(key, value) { entries.set(key, value); } };
}

function localStore() {
  const directory = new URL('../../.netlify/spotify/', import.meta.url);
  return {
    async get(key) {
      try { return await readFile(new URL(key, directory), 'utf8'); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async set(key, value) {
      await mkdir(directory, { recursive: true });
      const temporary = new URL(`${key}.${randomBytes(8).toString('hex')}.tmp`, directory);
      await writeFile(temporary, value, { mode: 0o600 });
      await rename(temporary, new URL(key, directory));
    },
  };
}

export function createVault({ clientId, secret, refreshToken, store }) {
  const key = createHash('sha256').update(`borik-spotify-v1\0${secret}\0${refreshToken}`).digest();
  const recordKey = createHash('sha256').update(clientId).update(key).digest('hex');
  store ||= process.env.SITE_ID ? getStore({ name: 'spotify-credentials', consistency: 'strong' }) : localStore();
  function seal(record) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(record), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
  }
  function open(value) {
    const data = Buffer.from(value, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8'));
  }
  return {
    async run(callback) {
      if (!store.getWithMetadata) return callback();
      const lockKey = `${recordKey}-lease`;
      const current = await store.getWithMetadata(lockKey, { type: 'json' });
      if (current?.data?.until > Date.now()) throw new SourceError('unavailable', 503, 60);
      const lease = await store.setJSON(lockKey, { until: Date.now() + 60000, owner: randomBytes(16).toString('hex') },
        current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
      if (!lease.modified) throw new SourceError('unavailable', 503, 60);
      try { return await callback(); }
      finally {
        // Podmíněné uvolnění nesmaže případného nového vlastníka zámku.
        await store.setJSON(lockKey, { until: 0 }, { onlyIfMatch: lease.etag });
      }
    },
    async read() {
      const value = await store.get(recordKey);
      const record = value ? open(value) : { token: refreshToken };
      if (record.disabled) throw new SourceError('reauthorize', 503, 3600);
      if (typeof record.token !== 'string' || !/^[\w.~+/=-]+$/.test(record.token)) throw new SourceError('not_configured', 503);
      return record.token;
    },
    async save(token) { await store.set(recordKey, seal({ token })); },
    async disable() { await store.set(recordKey, seal({ disabled: true })); },
  };
}
