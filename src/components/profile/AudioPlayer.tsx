import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Music2, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import type { Appearance, Track } from '@/lib/types';
import { useMedia } from '@/hooks/useMedia';
import { hexA } from '@/lib/util';

export interface AudioHandle { play: () => void }

const time = (s: number) => (isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

/**
 * Playlist player. Playback starts from the enter-screen click because browsers
 * block autoplay with sound. With `hidden` only the audio element is rendered,
 * so music still plays when the visible player is switched off.
 */
export const AudioPlayer = forwardRef<AudioHandle, { ap: Appearance; hidden?: boolean }>(function AudioPlayer({ ap, hidden }, ref) {
  const tracks = ap.audio.filter((t) => t.url);
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
  useEffect(() => { setVol(ap.audioVolume / 100); }, [ap.audioVolume]);
  useEffect(() => {
    setCur(0);
    if (playing) el.current?.play().catch(() => setPlaying(false));
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tracks.length) return null;

  const next = (d: number) => {
    if (ap.audioShuffle && tracks.length > 1) {
      let n = i;
      while (n === i) n = Math.floor(Math.random() * tracks.length);
      setI(n);
    } else setI((i + d + tracks.length) % tracks.length);
  };
  const audio = (
    <audio
      ref={el}
      src={src || undefined}
      onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => (tracks.length > 1 ? next(1) : el.current?.play())}
    />
  );
  if (hidden) return audio;

  const VolIcon = vol === 0 ? VolumeX : vol < 0.5 ? Volume1 : Volume2;
  const pct = dur ? (cur / dur) * 100 : 0;
  const fg = ap.textColor;
  const btn = 'grid place-items-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-white/40';

  return (
    <div className="flex w-full items-center gap-3 rounded-[14px] p-3 text-left" style={{ background: hexA(fg, 0.04), boxShadow: `inset 0 0 0 1px ${hexA(fg, 0.08)}` }}>
      {audio}
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[10px]" style={{ background: hexA(ap.accentColor, 0.16) }}>
        {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <Music2 size={18} style={{ color: ap.accentColor }} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-semibold" style={{ color: fg }}>{track?.title || 'Untitled'}</span>
          <span className="shrink-0 text-[11px] tabular-nums" style={{ color: hexA(fg, 0.45) }}>{time(cur)} / {time(dur)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={dur || 0}
          step={0.1}
          value={cur}
          aria-label="Seek"
          onChange={(e) => { if (el.current) el.current.currentTime = +e.target.value; }}
          className="range mt-1 block w-full"
          style={{ ['--p' as string]: `${pct}%`, ['--c' as string]: ap.accentColor }}
        />
      </div>
      <div className="flex shrink-0 items-center gap-0.5" style={{ color: fg }}>
        {tracks.length > 1 && (
          <button type="button" aria-label="Previous track" onClick={() => next(-1)} className={`${btn} h-8 w-8 opacity-60 hover:opacity-100`}>
            <SkipBack size={15} fill="currentColor" />
          </button>
        )}
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => (playing ? el.current?.pause() : el.current?.play().catch(() => {}))}
          className={`${btn} h-9 w-9 hover:scale-105 active:scale-95`}
          style={{ background: fg, color: ap.backgroundColor }}
        >
          {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
        </button>
        {tracks.length > 1 && (
          <button type="button" aria-label="Next track" onClick={() => next(1)} className={`${btn} h-8 w-8 opacity-60 hover:opacity-100`}>
            <SkipForward size={15} fill="currentColor" />
          </button>
        )}
        <div className="group relative hidden @[420px]:block">
          <button type="button" aria-label={vol ? 'Mute' : 'Unmute'} onClick={() => setVol(vol ? 0 : ap.audioVolume / 100 || 0.5)} className={`${btn} h-8 w-8 opacity-60 hover:opacity-100`}>
            <VolIcon size={16} />
          </button>
          <div className="invisible absolute bottom-full right-0 mb-1 rounded-[10px] bg-black/90 px-3 py-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={vol}
              aria-label="Volume"
              onChange={(e) => setVol(+e.target.value)}
              className="range block w-24"
              style={{ ['--p' as string]: `${vol * 100}%`, ['--c' as string]: ap.accentColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
