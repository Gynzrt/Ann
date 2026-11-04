import { useEffect, useState } from 'react';
import type { Appearance } from '@/lib/types';
import { hexA } from '@/lib/util';

interface Presence {
  discord_user: { id: string; username: string; global_name?: string; avatar?: string };
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  activities: { type: number; name: string; state?: string; details?: string; assets?: { large_image?: string }; application_id?: string }[];
  spotify?: { song: string; artist: string; album_art_url: string } | null;
}

const STATUS = { online: '#23a55a', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e' };

/**
 * Live Discord presence through the public Lanyard API (https://github.com/Phineas/lanyard).
 * Works for any user who has joined the Lanyard Discord server; otherwise shows a notice.
 */
export function DiscordCard({ ap }: { ap: Appearance }) {
  const [data, setData] = useState<Presence | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!ap.showDiscord || !/^\d{15,21}$/.test(ap.discordId)) return;
    let ws: WebSocket | null = null;
    let hb = 0;
    let closed = false;
    const connect = () => {
      ws = new WebSocket('wss://api.lanyard.rest/socket');
      ws.onmessage = (m) => {
        const msg = JSON.parse(m.data);
        if (msg.op === 1) {
          hb = window.setInterval(() => ws?.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
          ws?.send(JSON.stringify({ op: 2, d: { subscribe_to_id: ap.discordId } }));
        } else if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
          if (msg.d && msg.d.discord_user) { setData(msg.d); setErr(''); }
          else setErr('Join the Lanyard Discord server to show your presence.');
        }
      };
      ws.onclose = (e) => {
        clearInterval(hb);
        if (e.code === 4004) setErr('Join the Lanyard Discord server to show your presence.');
        else if (!closed) setTimeout(connect, 5000);
      };
    };
    connect();
    return () => { closed = true; clearInterval(hb); ws?.close(); };
  }, [ap.showDiscord, ap.discordId]);

  if (!ap.showDiscord || !ap.discordId) return null;
  const box = { background: hexA('#000000', 0.25), border: `1px solid ${hexA(ap.textColor, 0.08)}` };
  if (err || !data)
    return <div className="w-full rounded-xl p-3 text-center text-xs" style={{ ...box, color: hexA(ap.textColor, 0.6) }}>{err || 'Loading Discord status…'}</div>;

  const u = data.discord_user;
  const avatar = u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128` : 'https://cdn.discordapp.com/embed/avatars/0.png';
  const game = data.activities.find((a) => a.type === 0);
  const custom = data.activities.find((a) => a.type === 4);
  let line = custom?.state ?? '';
  let img = '';
  if (data.spotify) { line = `Listening to ${data.spotify.song} — ${data.spotify.artist}`; img = data.spotify.album_art_url; }
  else if (game) {
    line = `Playing ${game.name}${game.details ? ` · ${game.details}` : ''}`;
    const li = game.assets?.large_image;
    if (li && game.application_id && !li.startsWith('mp:')) img = `https://cdn.discordapp.com/app-assets/${game.application_id}/${li}.png`;
    else if (li?.startsWith('mp:')) img = `https://media.discordapp.net/${li.slice(3)}`;
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-xl p-2.5" style={box}>
      <div className="relative shrink-0">
        <img src={avatar} alt="" className="h-11 w-11 rounded-full" />
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-black/80" style={{ background: STATUS[data.discord_status] }} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-[14px] font-semibold" style={{ color: ap.textColor }}>{u.global_name || u.username}</div>
        <div className="truncate text-[12px]" style={{ color: hexA(ap.textColor, 0.6) }}>{line || data.discord_status}</div>
      </div>
      {img && <img src={img} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />}
    </div>
  );
}
