'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = 'owner' | 'guest' | 'anonymous';

interface AuthState {
  role: Role;
  isOwner: boolean;
  isAuthed: boolean;
  remaining: number | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({ role: 'anonymous', isOwner: false, isAuthed: false, remaining: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('anonymous');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(data => {
        setRole(data.role ?? 'anonymous');
        setRemaining(data.remaining ?? null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const isOwner = role === 'owner';
  const isAuthed = role !== 'anonymous';

  return (
    <AuthContext.Provider value={{ role, isOwner, isAuthed, remaining, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
