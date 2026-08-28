"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

export type SocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

interface SocketContextValue {
  socket: Socket | null;
  status: SocketStatus;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  status: "disconnected",
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Socket.IO lives at the server's origin (default path `/socket.io`), NOT
    // under `/api/v1`. Derive the origin from the API URL so we never send the
    // handshake to a `/api/v1/socket.io` path (which fails with "Invalid
    // namespace"), preferring an explicit NEXT_PUBLIC_SOCKET_URL if provided.
    const origin =
      process.env.NEXT_PUBLIC_SOCKET_URL ??
      new URL(
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
      ).origin;

    const nextSocket = io(origin, {
      withCredentials: true,
      transports: ["polling", "websocket"],
    });

    socketRef.current = nextSocket;
    // The socket instance is an external-system object that must be exposed to
    // React; storing it once on creation is a legitimate exception to the rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(nextSocket);

    const handleConnect = () => setStatus("connected");
    const handleDisconnect = () => setStatus("disconnected");
    const handleReconnecting = () => setStatus("reconnecting");
    // Guard against unbounded loops: `connect_error` fires once per failed
    // handshake, so every error would otherwise trigger a `/auth/refresh` POST
    // AND a forced reconnect — flooding the backend when the handshake cannot
    // succeed. Socket.IO already auto-reconnects with exponential backoff, so we
    // never call connect() here; we only (debounced) re-mint a possibly-stale
    // auth cookie so a subsequent auto-reconnect succeeds, and let the HTTP layer
    // (or upstream auth) handle a genuinely expired session.
    let lastRefresh = 0;
    const MIN_REFRESH_INTERVAL = 30_000;
    const handleConnectError = async () => {
      setStatus("error");
      const now = Date.now();
      if (now - lastRefresh < MIN_REFRESH_INTERVAL) return;
      lastRefresh = now;
      try {
        await api.post("/auth/refresh");
      } catch {
        // Session expired — skip; the app's HTTP layer will handle sign-out.
      }
    };

    nextSocket.on("connect", handleConnect);
    nextSocket.on("disconnect", handleDisconnect);
    nextSocket.on("reconnecting", handleReconnecting);
    nextSocket.on("connect_error", handleConnectError);

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("disconnect", handleDisconnect);
      nextSocket.off("reconnecting", handleReconnecting);
      nextSocket.off("connect_error", handleConnectError);
      nextSocket.disconnect();
      if (socketRef.current === nextSocket) {
        socketRef.current = null;
      }
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    setStatus("disconnected");
  }, []);

  const value = useMemo(
    () => ({ socket, status, disconnect }),
    [socket, status, disconnect],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  return context;
}
