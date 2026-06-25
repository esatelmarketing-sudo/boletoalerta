import { createContext, useContext, useState, ReactNode } from "react";
import { Empresa } from "../types";

interface AuthState {
  empresa: Empresa | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, empresa: Empresa) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadState(): AuthState {
  try {
    return {
      token: localStorage.getItem("@boletoalerta:token"),
      empresa: JSON.parse(localStorage.getItem("@boletoalerta:empresa") ?? "null"),
    };
  } catch {
    return { token: null, empresa: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState);

  function login(token: string, empresa: Empresa) {
    localStorage.setItem("@boletoalerta:token", token);
    localStorage.setItem("@boletoalerta:empresa", JSON.stringify(empresa));
    setState({ token, empresa });
  }

  function logout() {
    localStorage.removeItem("@boletoalerta:token");
    localStorage.removeItem("@boletoalerta:empresa");
    setState({ token: null, empresa: null });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAuthenticated: !!state.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
