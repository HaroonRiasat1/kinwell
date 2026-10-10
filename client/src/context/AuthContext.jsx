import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints.js';
import { setUnauthorizedHandler, tokenStore } from '../api/client.js';
import { useI18n } from '../i18n/index.js';

const AuthContext = createContext(null);

export const HOME_FOR_ROLE = { family: '/family', nutritionist: '/workspace', admin: '/admin', parent: '/parent' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const { setLanguage } = useI18n();

  // Parents see the app in the language saved on their account (e.g. Urdu).
  useEffect(() => {
    if (user?.role === 'parent' && user.language) setLanguage(user.language);
  }, [user, setLanguage]);

  const clear = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    authApi
      .me()
      .then(({ user: u }) => setUser(u))
      .catch(clear)
      .finally(() => setReady(true));
  }, [clear]);

  const startSession = useCallback(({ token, user: u }) => {
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(
    async (everywhere = false) => {
      try {
        await authApi.logout(everywhere);
      } finally {
        clear();
      }
    },
    [clear],
  );

  const value = useMemo(() => ({ user, ready, startSession, signOut }), [user, ready, startSession, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

// For components that also render outside the app (e.g. Storybook), where there may be no provider.
export const useOptionalAuth = () => useContext(AuthContext);
