import { createContext, useContext, useState, type ReactNode } from "react";
import type { PublicUser } from "../types";

interface AuthContextValue {
  user: PublicUser | null;
  isAdmin: boolean;
  login: (user: PublicUser, token: string) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = localStorage.getItem("user");
  const [user, setUser] = useState<PublicUser | null>(
    stored ? (JSON.parse(stored) as PublicUser) : null,
  );

  function login(userData: PublicUser, token: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthCtx.Provider
      value={{ user, isAdmin: user?.role === "admin", login, logout }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components -- context + hook in one file is intentional
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
