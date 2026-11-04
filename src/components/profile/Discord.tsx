import { useEffect, useState } from 'react';
import type { Appearance } from '@/lib/types';
import { siDiscord } from 'simple-icons';
import { hexA } from '@/lib/util';
import { useIsPreview } from './Bits';

interface Presence {
  discord_user: { id: string; username: string; global_name?: string; avatar?: string };
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  activities: { type: number; name: string; state?: string; details?: string; assets?: { large_image?: string }; application_id?: string }[];
  spotify?: { song: string; artist: string; album_art_url: string } | null;
}

const STATUS = { online: '#23a55a', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e' };
const STATUS_LABEL = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb', offline: 'Offline' };

/**
 * Live Discord presence through the public Lanyard API (https://github.com/Phineas/lanyard).
 * Works for any user who has joined the Lanyard Discord server; otherwise shows a notice.
 */
export function DiscordCard({ ap }: { ap: Appearance }) {
  const [data, setData] = useState<Presence | null>(null);
  const [err, setErr] = useState('');
  const preview = useIsPreview();

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

  if (!ap.showDiscord) return null;
  const box: React.CSSProperties = { background: hexA(ap.textColor, 0.04), boxShadow: `inset 0 0 0 1px ${hexA(ap.textColor, 0.08)}` };
  if (!/^\d{15,21}$/.test(ap.discordId)) {
    if (!preview) return null;
    return (
      <div className="flex w-full items-center gap-3 rounded-[14px] p-3 text-left" style={{ ...box, boxShadow: `inset 0 0 0 1px ${hexA(ap.textColor, 0.12)}` }}>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: hexA('#5865F2', 0.18) }}>
          <svg viewBox="0 0 24 24" width={20} height={20} fill="#8b93ff" aria-hidden><path d={siDiscord.path} /></svg>
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold" style={{ color: ap.textColor }}>Discord presence</div>
          <div className="text-[12px]" style={{ color: hexA(ap.textColor, 0.5) }}>Add your user ID in Widgets to show your status.</div>
        </div>
      </div>
    );
  }
  if (err)
    return <div className="w-full rounded-[14px] p-3 text-center text-[12px]" style={{ ...box, color: hexA(ap.textColor, 0.55) }}>{err}</div>;
  if (!data)
    return (
      <div className="flex w-full items-center gap-3 rounded-[14px] p-3" style={box} aria-label="Loading Discord status">
        <div className="skeleton h-11 w-11 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2"><div className="skeleton h-3 w-28 rounded" /><div className="skeleton h-2.5 w-40 rounded" /></div>
      </div>
    );

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
    <div className="flex w-full items-center gap-3 rounded-[14px] p-3" style={box}>
      <div className="relative shrink-0">
        <img src={avatar} alt="" className="h-11 w-11 rounded-full" />
        <span className="absolute -bottom-0.5 -right-0.5 h-[14px] w-[14px] rounded-full" style={{ background: STATUS[data.discord_status], boxShadow: `0 0 0 3px ${ap.backgroundColor}` }} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-[14px] font-semibold" style={{ color: ap.textColor }}>{u.global_name || u.username}</div>
        <div className="truncate text-[12.5px]" style={{ color: hexA(ap.textColor, 0.55) }}>{line || STATUS_LABEL[data.discord_status]}</div>
      </div>
      {img && <img src={img} alt="" className="h-11 w-11 shrink-0 rounded-[10px] object-cover" />}
    </div>
  );
}
