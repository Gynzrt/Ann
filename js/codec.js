/* A profile travels in the URL hash as #p=<format><base64url>.
 * Format 'z' is deflate-raw compressed JSON, 'j' is plain JSON (used when the
 * browser has no CompressionStream). */
import { clean, compact } from './schema.js';

const b64url = bytes => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const unb64url = s => {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
};

async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export async function encode(profile) {
  const json = new TextEncoder().encode(JSON.stringify(compact(profile)));
  if (typeof CompressionStream === 'function') {
    return 'z' + b64url(await pipe(json, new CompressionStream('deflate-raw')));
  }
  return 'j' + b64url(json);
}

export async function decode(code) {
  const kind = code[0];
  let bytes = unb64url(code.slice(1));
  if (kind === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  else if (kind !== 'j') throw new Error('Unknown profile format');
  return clean(JSON.parse(new TextDecoder().decode(bytes)));
}
