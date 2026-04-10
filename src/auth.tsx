import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type AuthContextValue = {
  user: string | null;
  setUser: (username: string | null) => void;
  clearUser: () => void;
};

const AUTH_STORAGE_KEY = "task-tracker-user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<string | null>(() => {
    return window.localStorage.getItem(AUTH_STORAGE_KEY);
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser: (username) => {
        setUserState(username);
        if (username) {
          window.localStorage.setItem(AUTH_STORAGE_KEY, username);
        } else {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      },
      clearUser: () => {
        setUserState(null);
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
