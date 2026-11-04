import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { backend } from './backend';
import type { Account, Profile } from './types';

interface AuthState {
  account: Account | null;
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setProfile: (p: Profile) => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const a = await backend.getAccount();
    setAccount(a);
    setProfile(a ? await backend.getMyProfile() : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    return backend.onAuthChange(() => {
      refresh();
    });
  }, [refresh]);

  return <Ctx.Provider value={{ account, profile, loading, refresh, setProfile }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
