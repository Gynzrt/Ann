import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import type { Appearance, Track } from '@/lib/types';
import { useMedia } from '@/hooks/useMedia';
import { hexA } from '@/lib/util';

export interface AudioHandle { play: () => void }

const time = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

/** Playlist player. Playback starts from the enter screen click, since browsers block autoplay with sound. */
export const AudioPlayer = forwardRef<AudioHandle, { ap: Appearance; compact?: boolean }>(function AudioPlayer({ ap, compact }, ref) {
  const tracks = ap.audio;
  const [i, setI] = useState(() => (ap.audioShuffle && tracks.length ? Math.floor(Math.random() * tracks.length) : 0));
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(ap.audioVolume / 100);
  const el = useRef<HTMLAudioElement>(null);
  const track: Track | undefined = tracks[i % Math.max(tracks.length, 1)];
  const src = useMedia(track?.url);
  const cover = useMedia(track?.cover);

  useImperativeHandle(ref, () => ({ play: () => { el.current?.play().catch(() => {}); } }), []);
  useEffect(() => { if (el.current) el.current.volume = vol; }, [vol]);
  useEffect(() => {
    if (playing) el.current?.play().catch(() => setPlaying(false));
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tracks.length || !ap.showPlayer) return src ? <audio ref={el} src={src} loop /> : null;

  const next = (d: number) => {
    if (ap.audioShuffle && tracks.length > 1) {
      let n = i;
      while (n === i) n = Math.floor(Math.random() * tracks.length);
      setI(n);
    } else setI((i + d + tracks.length) % tracks.length);
  };
  const VolIcon = vol === 0 ? VolumeX : vol < 0.5 ? Volume1 : Volume2;
  const pct = dur ? (cur / dur) * 100 : 0;

  return (
    <div className="flex w-full items-center gap-3 rounded-xl p-2.5" style={{ background: hexA('#000000', 0.25), border: `1px solid ${hexA(ap.textColor, 0.08)}` }}>
      <audio ref={el} src={src || undefined} onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => (tracks.length > 1 ? next(1) : el.current?.play())} />
      {!compact && (
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
          {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${ap.accentColor}, transparent)` }} />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-medium" style={{ color: ap.textColor }}>{track?.title || 'Untitled'}</span>
          <span className="shrink-0 text-[11px] tabular-nums" style={{ color: hexA(ap.textColor, 0.5) }}>{time(cur)} / {time(dur)}</span>
        </div>
        <input type="range" min={0} max={dur || 0} step={0.1} value={cur} aria-label="Seek"
          onChange={(e) => { if (el.current) el.current.currentTime = +e.target.value; }}
          className="range mt-1.5 w-full" style={{ ['--p' as string]: `${pct}%`, ['--c' as string]: ap.accentColor }} />
      </div>
      <div className="flex shrink-0 items-center gap-1" style={{ color: ap.textColor }}>
        {tracks.length > 1 && <button aria-label="Previous" onClick={() => next(-1)} className="rounded-md p-1 opacity-70 transition hover:opacity-100"><SkipBack size={16} /></button>}
        <button aria-label={playing ? 'Pause' : 'Play'} onClick={() => (playing ? el.current?.pause() : el.current?.play())}
          className="rounded-full p-1.5 transition hover:scale-105 active:scale-95" style={{ background: hexA(ap.textColor, 0.1) }}>
          {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
        {tracks.length > 1 && <button aria-label="Next" onClick={() => next(1)} className="rounded-md p-1 opacity-70 transition hover:opacity-100"><SkipForward size={16} /></button>}
        <div className="group relative hidden sm:block">
          <button aria-label="Mute" onClick={() => setVol(vol ? 0 : ap.audioVolume / 100 || 0.5)} className="rounded-md p-1 opacity-70 transition hover:opacity-100"><VolIcon size={16} /></button>
          <div className="absolute bottom-full right-0 hidden rounded-lg bg-black/90 p-2 group-hover:block">
            <input type="range" min={0} max={1} step={0.01} value={vol} aria-label="Volume" onChange={(e) => setVol(+e.target.value)}
              className="range w-24" style={{ ['--p' as string]: `${vol * 100}%`, ['--c' as string]: ap.accentColor }} />
          </div>
        </div>
      </div>
    </div>
  );
});
