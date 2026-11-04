import { RotateCcw } from 'lucide-react';
import { DEFAULT_APPEARANCE } from '@/lib/types';
import { cx } from '@/lib/util';
import { Button, ColorField, DARK_PRESETS, Rows, Section, Slider, SwitchRow } from '@/components/ui';
import { useDraft } from '../draft';

const THEMES = [
  { name: 'Midnight', bg: '#08080a', accent: '#8b5cf6', text: '#ffffff' },
  { name: 'Graphite', bg: '#0c0c0d', accent: '#d4d4d8', text: '#fafafa' },
  { name: 'Ocean', bg: '#06101a', accent: '#38bdf8', text: '#e0f2fe' },
  { name: 'Forest', bg: '#07110b', accent: '#4ade80', text: '#ecfdf5' },
  { name: 'Ember', bg: '#120806', accent: '#fb923c', text: '#fff7ed' },
  { name: 'Rose', bg: '#13070c', accent: '#f472b6', text: '#fff1f2' },
];

export function ColorsTab() {
  const { draft, setAp } = useDraft();
  const ap = draft.appearance;
  const anyGlow = ap.glowUsername || ap.glowSocials || ap.glowBadges;
  const reset = () =>
    setAp({
      accentColor: DEFAULT_APPEARANCE.accentColor,
      backgroundColor: DEFAULT_APPEARANCE.backgroundColor,
      textColor: DEFAULT_APPEARANCE.textColor,
      iconColor: DEFAULT_APPEARANCE.iconColor,
      borderColor: DEFAULT_APPEARANCE.borderColor,
    });

  return (
    <>
      <Section
        title="Themes"
        description="Start from a palette, then fine-tune it below."
        action={<Button variant="ghost" size="sm" onClick={reset}><RotateCcw size={13} />Reset</Button>}
      >
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const on = ap.backgroundColor === t.bg && ap.accentColor === t.accent && ap.textColor === t.text;
            return (
              <button
                key={t.name}
                type="button"
                aria-pressed={on}
                onClick={() => setAp({ backgroundColor: t.bg, accentColor: t.accent, textColor: t.text, iconColor: t.text })}
                className={cx(
                  'flex items-center gap-2.5 rounded-[10px] border p-2 text-left outline-none transition-[border-color,background-color] focus-visible:ring-2 focus-visible:ring-accent/50',
                  on ? 'border-accent/55 bg-accent/[.05]' : 'border-white/[.06] bg-field hover:border-white/[.13]',
                )}
              >
                <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-white/[.12]" style={{ background: t.bg }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.accent }} />
                </span>
                <span className="truncate text-[12.5px] font-medium text-zinc-300">{t.name}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Palette">
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Accent" value={ap.accentColor} onChange={(v) => setAp({ accentColor: v })} />
          <ColorField label="Background" value={ap.backgroundColor} presets={DARK_PRESETS} onChange={(v) => setAp({ backgroundColor: v })} />
          <ColorField label="Text" value={ap.textColor} onChange={(v) => setAp({ textColor: v })} />
          <ColorField label="Icons" value={ap.iconColor} onChange={(v) => setAp({ iconColor: v })} />
          <ColorField label="Border" value={ap.borderColor} alpha onChange={(v) => setAp({ borderColor: v })} />
        </div>
      </Section>

      <Section title="Icons" bodyClassName="pt-2">
        <Rows>
          <SwitchRow
            title="Monochrome icons"
            description="Use the icon colour for every social icon instead of each brand’s colour."
            checked={ap.monochromeIcons}
            onChange={(v) => setAp({ monochromeIcons: v })}
          />
        </Rows>
      </Section>

      <Section title="Glow" description="A soft light in your accent colour. Use it sparingly.">
        <Rows>
          <SwitchRow title="Username" checked={ap.glowUsername} onChange={(v) => setAp({ glowUsername: v })} />
          <SwitchRow title="Social icons" checked={ap.glowSocials} onChange={(v) => setAp({ glowSocials: v })} />
          <SwitchRow title="Badges" checked={ap.glowBadges} onChange={(v) => setAp({ glowBadges: v })} />
        </Rows>
        <Slider label="Strength" value={ap.glowStrength} min={0} max={100} unit="%" disabled={!anyGlow} onChange={(v) => setAp({ glowStrength: v })} />
      </Section>
    </>
  );
}
