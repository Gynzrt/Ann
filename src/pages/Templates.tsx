import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { MarketingPage, PageIntro } from '@/components/layout/SiteNav';
import { TEMPLATES } from '@/lib/templates';
import type { Template } from '@/lib/templates';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { Button, Segmented, useToast } from '@/components/ui';
import { TemplateCard, sampleWithBanner } from '@/components/dashboard/TemplateCard';

export function Templates() {
  const { account, profile, setProfile } = useAuth();
  const toast = useToast();
  const [tag, setTag] = useState('All');
  const [applied, setApplied] = useState('');
  const [busy, setBusy] = useState('');
  const nav = useNavigate();
  const tags = ['All', ...new Set(TEMPLATES.map((t) => t.tag))];

  const apply = async (t: Template) => {
    if (!account || !profile) return nav('/register');
    setBusy(t.id);
    try {
      const prev = profile.appearance;
      const p = await backend.updateProfile({ appearance: { ...prev, ...t.appearance } });
      setProfile(p);
      setApplied(t.id);
      toast({
        title: `${t.name} applied to your page`,
        duration: 6000,
        action: { label: 'Undo', run: () => { backend.updateProfile({ appearance: prev }).then((x) => { setProfile(x); setApplied(''); }); } },
      });
    } catch (x) {
      toast({ tone: 'error', title: 'Couldn’t apply that', description: (x as Error).message });
    } finally {
      setBusy('');
    }
  };

  return (
    <MarketingPage>
      <PageIntro eyebrow="Templates" title="Start from a look you love">Applying a template changes only the style. Your name, links and media stay as they are.</PageIntro>
      <section className="px-4 pb-28 pt-12 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="no-scrollbar flex justify-center overflow-x-auto">
            <Segmented size="sm" full={false} value={tag} onChange={setTag} options={tags.map((x) => ({ value: x, label: x }))} />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.filter((t) => tag === 'All' || t.tag === tag).map((t) => (
              <TemplateCard
                key={t.id}
                t={t}
                profile={sampleWithBanner(t)}
                actions={
                  <Button size="sm" variant="secondary" loading={busy === t.id} onClick={() => apply(t)}>
                    {applied === t.id ? <><Check size={14} />Applied</> : account ? 'Use template' : <>Sign up to use <ArrowRight size={13} /></>}
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
