import { useEffect, useState } from 'react';

const SESSION_KEY = 'ecocare_auth_session_v1';
const WORK_EMAIL_DOMAIN = 'ecocare.id';

type Session = {
  userId: string;
  userName: string;
  userEmail: string;
  accessToken: string;
};

const parseStoredSession = (): Session | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(parseStoredSession());
    setLoading(false);
  }, []);

  const loginWithWorkEmail = async (email: string, userName: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith(`@${WORK_EMAIL_DOMAIN}`)) {
      throw new Error(`Use your @${WORK_EMAIL_DOMAIN} work email.`);
    }

    const fakeSession: Session = {
      userId: crypto.randomUUID(),
      userName: userName.trim() || normalizedEmail,
      userEmail: normalizedEmail,
      accessToken: `local-${crypto.randomUUID()}`,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(fakeSession));
    setSession(fakeSession);
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return {
    user: session,
    loading,
    loginWithWorkEmail,
    logout,
  };
};
