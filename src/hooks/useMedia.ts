import { useEffect, useState } from 'react';
import { idbGet } from '@/lib/backend/idb';
import { safeUrl } from '@/lib/platforms';

const cache = new Map<string, string>();

/** Resolves an uploaded file reference to something an <img>/<video>/<audio> can load. */
export function useMedia(ref: string | undefined): string {
  const [url, setUrl] = useState(() => resolveSync(ref));
  useEffect(() => {
    let alive = true;
    if (ref?.startsWith('idb://')) {
      const key = ref.slice(6);
      if (cache.has(key)) setUrl(cache.get(key)!);
      else
        idbGet<Blob>(key).then((b) => {
          if (!b || !alive) return;
          const u = URL.createObjectURL(b);
          cache.set(key, u);
          setUrl(u);
        });
    } else setUrl(resolveSync(ref));
    return () => {
      alive = false;
    };
  }, [ref]);
  return url;
}

function resolveSync(ref: string | undefined) {
  if (!ref) return '';
  if (ref.startsWith('idb://')) return cache.get(ref.slice(6)) ?? '';
  return safeUrl(ref) && /^https?:/.test(ref) ? ref : '';
}
