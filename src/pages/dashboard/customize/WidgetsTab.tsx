import { Check, ExternalLink } from 'lucide-react';
import { siDiscord } from 'simple-icons';
import { Field, Input, Rows, Section, SwitchRow } from '@/components/ui';
import { useDraft } from '../draft';
import type { TabProps } from './shared';

const ID_RE = /^\d{15,21}$/;

export function WidgetsTab({ goTo }: TabProps) {
  const { draft, setAp } = useDraft();
  const ap = draft.appearance;
  const valid = ID_RE.test(ap.discordId);
  const count = ap.audio.filter((t) => t.url).length;
  return (
    <>
      <Section title="Discord presence" description="Show your live status, game or Spotify track from Discord.">
        <Rows>
          <SwitchRow title="Show Discord presence" checked={ap.showDiscord} onChange={(v) => setAp({ showDiscord: v })} />
        </Rows>
        {ap.showDiscord && (
          <>
            <Field label="Discord user ID" error={ap.discordId && !valid ? 'A user ID is a number with 17 to 20 digits.' : undefined}>
              <Input
                inputMode="numeric"
                value={ap.discordId}
                placeholder="123456789012345678"
                invalid={!!ap.discordId && !valid}
                onChange={(e) => setAp({ discordId: e.target.value.replace(/\D/g, '').slice(0, 21) })}
                prefix={<svg viewBox="0 0 24 24" width={15} height={15} fill="#8b93ff" className="mr-2.5" aria-hidden><path d={siDiscord.path} /></svg>}
                suffix={valid ? <Check size={15} className="text-emerald-400" /> : null}
              />
            </Field>
            <ol className="space-y-2.5 rounded-[12px] border border-white/[.06] bg-white/[.015] p-4 text-[12.5px] leading-relaxed text-zinc-400">
              {[
                <>Join the <a href="https://discord.gg/lanyard" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-zinc-200 hover:underline">Lanyard server <ExternalLink size={11} /></a>. It shares your presence publicly.</>,
                <>In Discord, open Settings, then Advanced, and turn on Developer Mode.</>,
                <>Right-click your name and choose Copy User ID.</>,
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/[.1] text-[11px] font-semibold text-zinc-300">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </Section>

      <Section title="Music player" bodyClassName="pt-2">
        <Rows>
          <SwitchRow title="Show player" description="A compact player with your playlist." checked={ap.showPlayer} onChange={(v) => setAp({ showPlayer: v })} />
        </Rows>
        <p className="text-[12px] text-zinc-500">
          {count ? `${count} ${count === 1 ? 'track' : 'tracks'} in your playlist. ` : 'Your playlist is empty. '}
          <button type="button" onClick={() => goTo('audio')} className="font-medium text-zinc-300 underline-offset-2 hover:text-white hover:underline">Manage playlist</button>
        </p>
      </Section>
    </>
  );
}
