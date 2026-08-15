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
import { getStoredUser, setStoredUser, clearStoredUser } from "@/lib/auth-storage";

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: SafeUserDto | null;
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
    typeof window === "undefined" ? true : Boolean(user),
  );

  useEffect(() => {
    if (user) {
      setIsBooting(false);
      return;
    }

    let cancelled = false;
    api
      .get<SafeUserDto>("/auth/profile")
      .then((response) => {
        if (cancelled) {
          return;
        }
        setUser(response.data);
        setStoredUser(JSON.stringify(response.data));
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiError && error.statusCode === 401) {
          clearStoredUser();
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
  }, [user]);

  const login = useCallback(
    async (input: LoginInput) => {
      const { data } = await api.post<{ user: SafeUserDto }>(
        "/auth/login",
        input,
      );
      setUser(data.user);
      setStoredUser(JSON.stringify(data.user));
      router.replace("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors
    }
    clearStoredUser();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const response = await api.get<SafeUserDto>("/auth/profile");
    setUser(response.data);
    setStoredUser(JSON.stringify(response.data));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "ADMIN",
      isBooting,
      login,
      logout,
      refreshUser,
    }),
    [user, isBooting, login, logout, refreshUser],
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
