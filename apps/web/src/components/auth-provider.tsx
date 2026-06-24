'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as auth from '../lib/auth-client';

interface AuthContextValue {
  user: auth.AuthUser | null;
  /** True until the first refresh-on-mount completes. */
  loading: boolean;
  login(input: { email: string; password: string }): Promise<auth.AuthUser>;
  register(input: {
    name: string;
    email: string;
    password: string;
    turnstileToken?: string;
  }): Promise<auth.AuthUser>;
  logout(): Promise<void>;
  /** Returns the current access token, refreshing it if necessary. */
  getAccessToken(): Promise<string | null>;
  /** Refreshes /me from the API. */
  reloadUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<auth.AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);
  const expiresAtRef = useRef<number>(0);

  const applySession = useCallback((session: auth.AuthSession) => {
    accessTokenRef.current = session.accessToken;
    expiresAtRef.current = Date.now() + session.expiresIn * 1000 - 30_000;
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    expiresAtRef.current = 0;
    setUser(null);
  }, []);

  // On first mount: try to refresh the session using the httpOnly cookie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshed = await auth.refresh();
      if (cancelled) return;
      if (!refreshed) {
        setLoading(false);
        return;
      }
      accessTokenRef.current = refreshed.accessToken;
      expiresAtRef.current = Date.now() + refreshed.expiresIn * 1000 - 30_000;
      const me = await auth.fetchMe(refreshed.accessToken);
      if (cancelled) return;
      if (me) {
        setUser(me);
      } else {
        clearSession();
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (accessTokenRef.current && expiresAtRef.current > Date.now()) {
      return accessTokenRef.current;
    }
    const refreshed = await auth.refresh();
    if (!refreshed) {
      clearSession();
      return null;
    }
    accessTokenRef.current = refreshed.accessToken;
    expiresAtRef.current = Date.now() + refreshed.expiresIn * 1000 - 30_000;
    return accessTokenRef.current;
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (input) => {
        const session = await auth.login(input);
        applySession(session);
        return session.user;
      },
      register: async (input) => {
        const session = await auth.register(input);
        applySession(session);
        return session.user;
      },
      logout: async () => {
        await auth.logout();
        clearSession();
      },
      getAccessToken,
      reloadUser: async () => {
        const token = await getAccessToken();
        if (!token) {
          clearSession();
          return;
        }
        const me = await auth.fetchMe(token);
        if (me) setUser(me);
        else clearSession();
      },
    }),
    [user, loading, applySession, clearSession, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
