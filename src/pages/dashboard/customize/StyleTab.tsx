import { LAYOUT_INFO } from '@/components/profile/Layouts';
import { loadFont } from '@/lib/util';
import type { Entrance, Font } from '@/lib/types';
import { Field, FieldLabel, Input, OptionGrid, Rows, Section, Segmented, Select, Slider, SwitchRow } from '@/components/ui';
import { useDraft } from '../draft';
import { LayoutThumb } from './shared';

const FONTS: Font[] = ['Inter', 'Poppins', 'Space Grotesk', 'JetBrains Mono', 'Playfair Display', 'Press Start 2P'];
const FONT_NOTE: Record<Font, string> = {
  Inter: 'Clean and neutral',
  Poppins: 'Round and friendly',
  'Space Grotesk': 'Quirky grotesque',
  'JetBrains Mono': 'Monospaced',
  'Playfair Display': 'Elegant serif',
  'Press Start 2P': 'Pixel arcade',
};

export function StyleTab() {
  const { draft, setAp } = useDraft();
  const ap = draft.appearance;
  const noCard = ap.layout === 'simplistic';
  const info = LAYOUT_INFO.find((l) => l.id === ap.layout);

  return (
    <>
      <Section title="Layout" description={info?.description}>
        <OptionGrid
          ariaLabel="Layout"
          cols={3}
          previewClass="h-[80px]"
          value={ap.layout}
          onChange={(v) => setAp({ layout: v })}
          options={LAYOUT_INFO.map((l) => ({ value: l.id, label: l.name, title: l.description, preview: <LayoutThumb id={l.id} active={ap.layout === l.id} /> }))}
        />
      </Section>

      <Section title="Typography">
        <div>
          <FieldLabel aside={FONT_NOTE[ap.font]}>Font</FieldLabel>
          <Select
            ariaLabel="Font"
            value={ap.font}
            onChange={(v) => setAp({ font: v })}
            onOpen={() => FONTS.forEach(loadFont)}
            options={FONTS.map((f) => ({ value: f, label: f }))}
            renderOption={(o) => (
              <span className="flex items-center gap-2.5">
                <span className="w-6 text-center text-[15px] text-zinc-400" style={{ fontFamily: `'${o.value}'` }}>Aa</span>
                <span>{o.label}</span>
              </span>
            )}
          />
        </div>
      </Section>

      <Section title="Card" description={noCard ? 'The Simplistic layout has no card, so these settings are off.' : 'The panel your profile sits on.'}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-5">
          <Slider label="Opacity" value={ap.profileOpacity} min={0} max={100} unit="%" disabled={noCard} onChange={(v) => setAp({ profileOpacity: v })} />
          <Slider label="Blur" value={ap.profileBlur} min={0} max={40} unit="px" disabled={noCard} onChange={(v) => setAp({ profileBlur: v })} />
          <Slider label="Corner radius" value={ap.borderRadius} min={0} max={40} unit="px" disabled={noCard} onChange={(v) => setAp({ borderRadius: v })} />
          <Slider label="Border" value={ap.borderWidth} min={0} max={4} unit="px" disabled={noCard} onChange={(v) => setAp({ borderWidth: v })} />
        </div>
      </Section>

      <Section title="Motion">
        <div>
          <FieldLabel>Entrance animation</FieldLabel>
          <Segmented<Entrance>
            value={ap.entrance}
            onChange={(v) => setAp({ entrance: v })}
            options={[{ value: 'fade', label: 'Fade' }, { value: 'slide', label: 'Slide' }, { value: 'zoom', label: 'Zoom' }, { value: 'none', label: 'None' }]}
          />
        </div>
        <Rows>
          <SwitchRow title="3D tilt" description="Your profile leans gently toward the cursor." checked={ap.tilt} onChange={(v) => setAp({ tilt: v })} />
        </Rows>
      </Section>

      <Section title="Browser tab">
        <Field label="Tab title" hint="Leave empty to show @username.">
          <Input value={ap.tabTitle} maxLength={60} placeholder={`@${draft.username}`} onChange={(e) => setAp({ tabTitle: e.target.value })} />
        </Field>
      </Section>
    </>
  );
}
