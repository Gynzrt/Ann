import { Circle, CircleDot, ImageIcon, MousePointer2, RotateCcw } from 'lucide-react';
import type { BackgroundEffect, CursorStyle, UsernameEffect } from '@/lib/types';
import { hexA } from '@/lib/util';
import { Button, Field, FieldLabel, Input, OptionGrid, Rows, Section, Segmented, Slider, SwitchRow, Textarea } from '@/components/ui';
import { isGlEffect } from '@/components/profile/gl/GLBackground';
import { Upload } from '@/components/dashboard/Upload';
import { useDraft } from '../draft';
import { FxPreview } from './shared';
import type { TabProps } from './shared';

const BG: { value: BackgroundEffect; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'particles', label: 'Particles' },
  { value: 'snow', label: 'Snow' },
  { value: 'rain', label: 'Rain' },
  { value: 'stars', label: 'Stars' },
  { value: 'nightfall', label: 'Meteors' },
  { value: 'blur-orbs', label: 'Orbs' },
];

const GL: { value: BackgroundEffect; label: string; title: string }[] = [
  { value: 'fluid', label: 'Fluid', title: 'A live fluid simulation that visitors can stir' },
  { value: 'aurora', label: 'Aurora', title: 'Curtains of light drifting across the sky' },
  { value: 'liquid', label: 'Liquid', title: 'Slowly flowing, warped colour' },
  { value: 'warp', label: 'Warp', title: 'Stars streaking past at warp speed' },
];

const NAME: { value: UsernameEffect; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'glow', label: 'Glow' },
  { value: 'rainbow', label: 'Rainbow' },
  { value: 'shimmer', label: 'Shimmer' },
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'typewriter', label: 'Typewriter' },
];

function NameSample({ effect, accent }: { effect: UsernameEffect; accent: string }) {
  const base = 'text-[19px] font-semibold tracking-[-0.02em]';
  if (effect === 'rainbow')
    return <span className={`${base} animate-rainbow bg-clip-text text-transparent`} style={{ backgroundImage: 'linear-gradient(90deg,#ff6b6b,#ffc46b,#5ee89a,#5ab4ff,#b98bff,#ff6b6b)', backgroundSize: '200% 100%' }}>Aa</span>;
  if (effect === 'shimmer')
    return <span className={`${base} animate-rainbow bg-clip-text text-transparent`} style={{ backgroundImage: `linear-gradient(90deg,#fff 0%,#fff 38%,${accent} 50%,#fff 62%,#fff 100%)`, backgroundSize: '200% 100%' }}>Aa</span>;
  if (effect === 'glow') return <span className={`${base} name-pulse text-white`} style={{ ['--g' as string]: hexA(accent, 0.8) }}>Aa</span>;
  if (effect === 'sparkle')
    return (
      <span className={`${base} relative inline-block text-white`}>
        Aa
        {[0, 1, 2].map((i) => <span key={i} className="sparkle" style={{ left: `${15 + i * 35}%`, animationDelay: `${i * 0.6}s`, background: accent }} />)}
      </span>
    );
  if (effect === 'typewriter') return <span className={`${base} text-white`}>Aa<span className="tw-caret">|</span></span>;
  return <span className={`${base} text-zinc-300`}>Aa</span>;
}

function CursorPreview({ id, accent }: { id: CursorStyle; accent: string }) {
  if (id === 'dot') return <Circle size={9} fill={accent} stroke="none" />;
  if (id === 'ring') return <CircleDot size={20} style={{ color: accent }} />;
  if (id === 'trail')
    return (
      <span className="flex items-center gap-1">
        {[0.25, 0.5, 1].map((o, i) => <span key={i} className="rounded-full" style={{ width: 4 + i * 2, height: 4 + i * 2, background: accent, opacity: o }} />)}
      </span>
    );
  if (id === 'custom') return <ImageIcon size={18} />;
  return <MousePointer2 size={18} />;
}

export function EffectsTab({ goTo, onReplay }: TabProps) {
  const { draft, setAp } = useDraft();
  const ap = draft.appearance;
  return (
    <>
      <Section title="Background" description="An animated layer behind your profile.">
        <div>
          <FieldLabel aside={<span className="rounded-[5px] border border-white/[.1] px-1.5 py-px text-[10px] font-semibold tracking-[0.06em] text-zinc-400">GPU</span>}>WebGL</FieldLabel>
          <OptionGrid
            ariaLabel="WebGL background effect"
            cols={4}
            previewClass="h-[58px]"
            value={ap.backgroundEffect}
            onChange={(v) => setAp({ backgroundEffect: v })}
            options={GL.map((b) => ({ value: b.value, label: b.label, title: b.title, preview: <FxPreview id={b.value} color={ap.accentColor} /> }))}
          />
        </div>
        {isGlEffect(ap.backgroundEffect) && (
          <div className="space-y-4 rounded-[12px] border border-white/[.06] bg-white/[.015] p-4">
            <Slider label="Intensity" value={ap.fxIntensity} min={10} max={100} unit="%" onChange={(v) => setAp({ fxIntensity: v })} />
            {ap.backgroundEffect === 'fluid' && (
              <div>
                <FieldLabel>Colours</FieldLabel>
                <Segmented
                  value={ap.fluidRainbow ? 'rainbow' : 'accent'}
                  onChange={(v) => setAp({ fluidRainbow: v === 'rainbow' })}
                  options={[{ value: 'accent', label: 'Accent' }, { value: 'rainbow', label: 'Rainbow' }]}
                />
              </div>
            )}
            <p className="text-[12px] leading-relaxed text-zinc-500">
              {ap.backgroundEffect === 'fluid'
                ? 'Visitors stir it with the cursor or a finger, and it keeps flowing on its own when nobody does. Try it in the preview.'
                : 'Rendered on the GPU and paused when the page is hidden. Visitors who prefer reduced motion see a still version.'}
            </p>
          </div>
        )}
        <div>
          <FieldLabel>Canvas</FieldLabel>
          <OptionGrid
            ariaLabel="Background effect"
            cols={4}
            previewClass="h-[54px]"
            value={ap.backgroundEffect}
            onChange={(v) => setAp({ backgroundEffect: v })}
            options={BG.map((b) => ({ value: b.value, label: b.label, preview: <FxPreview id={b.value} color={ap.accentColor} /> }))}
          />
        </div>
        {ap.backgroundUrl ? (
          <Slider label="Dim background media" value={ap.backgroundDim} min={0} max={90} unit="%" onChange={(v) => setAp({ backgroundDim: v })} />
        ) : (
          <p className="text-[12px] text-zinc-500">
            Want a photo or video behind it?{' '}
            <button type="button" onClick={() => goTo('profile')} className="font-medium text-zinc-300 underline-offset-2 hover:text-white hover:underline">Upload one in Profile</button>.
          </p>
        )}
      </Section>

      <Section title="Username" description="An effect on your display name.">
        <OptionGrid
          ariaLabel="Username effect"
          cols={3}
          previewClass="h-[52px]"
          value={ap.usernameEffect}
          onChange={(v) => setAp({ usernameEffect: v })}
          options={NAME.map((n) => ({ value: n.value, label: n.label, preview: <NameSample effect={n.value} accent={ap.accentColor} /> }))}
        />
      </Section>

      <Section title="Description" bodyClassName="pt-2">
        <Rows>
          <SwitchRow
            title="Typewriter description"
            description="Types out a few lines in turn instead of your description."
            checked={ap.typewriterBio}
            onChange={(v) => setAp({ typewriterBio: v })}
          />
        </Rows>
        {ap.typewriterBio && (
          <Field label="Lines" hint="One per row, up to 8." aside={`${ap.typewriterLines.filter(Boolean).length}/8`}>
            <Textarea
              rows={4}
              value={ap.typewriterLines.join('\n')}
              placeholder={'designer and developer\nnight owl\nalways building something'}
              onChange={(e) => setAp({ typewriterLines: e.target.value.split('\n').slice(0, 8).map((s) => s.slice(0, 100)) })}
            />
          </Field>
        )}
      </Section>

      <Section title="Cursor">
        <OptionGrid
          ariaLabel="Cursor"
          cols={5}
          previewClass="h-[48px]"
          value={ap.cursor}
          onChange={(v) => setAp({ cursor: v })}
          options={(['default', 'dot', 'ring', 'trail', 'custom'] as CursorStyle[]).map((c) => ({
            value: c,
            label: c === 'default' ? 'Arrow' : c === 'custom' ? 'Image' : c[0].toUpperCase() + c.slice(1),
            preview: <CursorPreview id={c} accent={ap.accentColor} />,
          }))}
        />
        {ap.cursor === 'custom' && (
          <Upload kind="cursor" label="Cursor image" value={ap.cursorUrl} onChange={(u) => setAp({ cursorUrl: u })} />
        )}
      </Section>

      <Section title="Enter screen" bodyClassName="pt-2">
        <Rows>
          <SwitchRow
            title="Click-to-enter screen"
            description="Visitors click once before your page appears. Music can only start after a click."
            checked={ap.enterScreen}
            onChange={(v) => setAp({ enterScreen: v })}
          />
        </Rows>
        {ap.enterScreen && (
          <div className="flex items-end gap-2">
            <Field label="Text" className="flex-1">
              <Input value={ap.enterText} maxLength={40} onChange={(e) => setAp({ enterText: e.target.value })} placeholder="click to enter..." />
            </Field>
            <Button variant="secondary" className="h-10" onClick={onReplay}><RotateCcw size={14} />Replay</Button>
          </div>
        )}
      </Section>
    </>
  );
}
