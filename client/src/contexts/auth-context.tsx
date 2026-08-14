"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { SafeUserDto } from "@/types";
import { api, ApiError } from "@/lib/api";
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
} from "@/lib/auth-storage";

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: SafeUserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBooting: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getStoredToken(),
  );
  const [user, setUser] = useState<SafeUserDto | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const storedUser = getStoredUser();
    if (!storedUser) {
      return null;
    }
    try {
      return JSON.parse(storedUser) as SafeUserDto;
    } catch {
      return null;
    }
  });
  const [isBooting, setIsBooting] = useState(() =>
    typeof window === "undefined" ? true : Boolean(token),
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    api
      .get<SafeUserDto>("/api/auth/profile")
      .then((response) => {
        if (cancelled) {
          return;
        }
        setUser(response.data);
        setStoredAuth(token, JSON.stringify(response.data));
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiError && error.statusCode === 401) {
          clearStoredAuth();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsBooting(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(
    async (input: LoginInput) => {
      const { data } = await api.post<{ token: string; user: SafeUserDto }>(
        "/api/auth/login",
        input,
      );
      setToken(data.token);
      setUser(data.user);
      setStoredAuth(data.token, JSON.stringify(data.user));
      router.replace("/dashboard");
    },
    [router],
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const response = await api.get<SafeUserDto>("/api/auth/profile");
    setUser(response.data);
    const currentToken = getStoredToken();
    if (currentToken) {
      setStoredAuth(currentToken, JSON.stringify(response.data));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "ADMIN",
      isBooting,
      login,
      logout,
      refreshUser,
    }),
    [user, token, isBooting, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
