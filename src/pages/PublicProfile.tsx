import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { backend } from '@/lib/backend';
import type { Profile } from '@/lib/types';
import { ProfileView } from '@/components/profile/ProfileView';
import { Spinner } from '@/components/layout/Spinner';
import { NotFound } from './NotFound';

export function PublicProfile() {
  const { username = '' } = useParams();
  const [p, setP] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setP(undefined);
    backend.getProfile(username).then(async (prof) => {
      if (!alive) return;
      setP(prof);
      if (prof) {
        const views = await backend.recordView(prof.username);
        if (alive) setP({ ...prof, views });
      }
    }).catch(() => alive && setP(null));
    return () => { alive = false; };
  }, [username]);

  if (p === undefined) return <Spinner full />;
  if (!p) return <NotFound text={`@${username} hasn't been claimed yet.`} claim={username} />;
  return <ProfileView p={p} />;
}
