import { decode } from './codec.js';
import { render } from './render.js';

const DRAFT_KEY = 'halo:draft';

async function boot() {
  const m = location.hash.match(/^#p=([A-Za-z0-9_-]+)$/);
  if (m) {
    try {
      const profile = await decode(m[1]);
      const stage = document.getElementById('profile');
      stage.hidden = false;
      render(stage, profile);
      return;
    } catch (e) {
      console.warn('Could not read this profile link, opening the editor instead.', e);
    }
  }
  const [{ startEditor }, { STARTER }] = await Promise.all([import('./editor.js'), import('./schema.js')]);
  let draft = null;
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  } catch {}
  startEditor(draft || STARTER);
}

addEventListener('hashchange', () => location.reload());
boot();
