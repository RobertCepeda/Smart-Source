import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../services/api";
import { DEMO_TOKEN, DEMO_USER, isDemoMode, loginRequest, meRequest, registerRequest, updateProfileRequest } from "../services/api";

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = LoginInput & {
  name: string;
  company?: string;
  accountType: "PERSONAL" | "BUSINESS";
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  updateProfile: (input: { name?: string; company?: string; avatarUrl?: string }) => Promise<AuthUser>;
  logout: () => void;
};

const TOKEN_KEY = "smart_source_token";
const USER_KEY = "smart_source_user";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser() {
  const stored = localStorage.getItem(USER_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => (isDemoMode ? DEMO_TOKEN : localStorage.getItem(TOKEN_KEY)));
  const [user, setUser] = useState<AuthUser | null>(() => (isDemoMode ? DEMO_USER : readStoredUser()));
  const [isLoading, setLoading] = useState(() => !isDemoMode && Boolean(token));

  const storeSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    if (!isDemoMode) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    }
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    if (isDemoMode) {
      setToken(DEMO_TOKEN);
      setUser(DEMO_USER);
      return;
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const result = await meRequest(token);

        if (isMounted) {
          localStorage.setItem(USER_KEY, JSON.stringify(result.user));
          setUser(result.user);
        }
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [logout, token]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await loginRequest(input);
      storeSession(result.token, result.user);
      return result.user;
    },
    [storeSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await registerRequest(input);
      storeSession(result.token, result.user);
      return result.user;
    },
    [storeSession],
  );

  const updateProfile = useCallback(
    async (input: { name?: string; company?: string; avatarUrl?: string }) => {
      if (!token) {
        throw new Error("Sesión requerida.");
      }

      const result = await updateProfileRequest(token, input);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      setUser(result.user);
      return result.user;
    },
    [token],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      updateProfile,
      logout,
    }),
    [isLoading, login, logout, register, token, updateProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
