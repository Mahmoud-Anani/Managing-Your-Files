"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/contexts/auth-context";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket((current) => {
        current?.disconnect();
        return null;
      });
      return;
    }

    const connectionUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:8080";

    const nextSocket = io(connectionUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    nextSocket.emit("join-user-room", user.id);
    if (isAdmin) {
      nextSocket.emit("join-admin-room");
    }
    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, user?.id]);

  const value = useMemo(() => socket, [socket]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  return context;
}
