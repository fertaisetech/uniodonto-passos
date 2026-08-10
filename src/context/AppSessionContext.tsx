import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { logout, observeUserProfile, resolveDisplayNameFromEmail, resolveRoleFromEmail, type AppUserProfile } from "../lib/firebase";

type AppSessionValue = {
  profile: AppUserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const SESSION_KEY = "uniodonto_user_session";
const AppSessionContext = createContext<AppSessionValue | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      setLoading(false);
      return;
    }

    try {
      const saved = JSON.parse(raw) as AppUserProfile;
      const corrected = { ...saved, name: resolveDisplayNameFromEmail(saved.email || "", saved.name), role: resolveRoleFromEmail(saved.email || saved.name || "") };
      setProfile(corrected);
      localStorage.setItem(SESSION_KEY, JSON.stringify(corrected));
      setLoading(false);
    } catch {
      localStorage.removeItem(SESSION_KEY);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile?.uid) return;

    const unsubscribe = observeUserProfile(
      profile.uid,
      (nextProfile) => {
        if (!nextProfile) return;

        setProfile((current) => {
          const merged = { ...(current ?? nextProfile), ...nextProfile, name: resolveDisplayNameFromEmail(nextProfile.email || current?.email || "", nextProfile.name), role: resolveRoleFromEmail(nextProfile.email || current?.email || "") };
          localStorage.setItem(SESSION_KEY, JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent("uniodonto-session-changed"));
          return merged;
        });
      },
      () => {
        // Keep the local session active when Firestore access is blocked.
      }
    );

    return unsubscribe;
  }, [profile?.uid]);

  useEffect(() => {
    const syncSession = () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) {
          setProfile(null);
          return;
        }

        setProfile(JSON.parse(raw) as AppUserProfile);
      } catch {
        setProfile(null);
      }
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener("uniodonto-session-changed", syncSession as EventListener);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("uniodonto-session-changed", syncSession as EventListener);
    };
  }, []);

  const signOut = async () => {
    await logout();
    localStorage.removeItem(SESSION_KEY);
    setProfile(null);
    window.dispatchEvent(new CustomEvent("uniodonto-session-changed"));
  };

  const value = useMemo<AppSessionValue>(() => ({
    profile,
    loading,
    signOut,
  }), [profile, loading]);

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const ctx = useContext(AppSessionContext);
  if (!ctx) throw new Error("useAppSession must be used within AppSessionProvider");
  return ctx;
}

export const setAppSession = (profile: AppUserProfile) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("uniodonto-session-changed"));
};

export const clearAppSession = () => {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent("uniodonto-session-changed"));
};
