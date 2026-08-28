"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import {
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadQuery = useUnreadNotificationCount();
  const listQuery = useNotifications({ page: 1, limit: 20 });

  const unreadCount = unreadQuery.data ?? 0;
  const notifications = listQuery.data?.data ?? [];

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch("/notifications/read-all");
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => invalidate(),
  });

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("notifications.bellLabel")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative"
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span
            className="absolute -top-0.5 -end-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground"
            aria-label={t("notifications.unreadCount", { count: unreadCount })}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute end-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold">
              {t("notifications.title")}
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {markAllRead.isPending ? (
                  <Spinner className="size-3" />
                ) : (
                  <CheckCheck className="size-3.5" />
                )}
                {t("notifications.markAllRead")}
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {listQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                {t("common.loading")}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {t("notifications.empty")}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!notification.isRead) {
                          markRead.mutate(notification.id);
                        }
                      }}
                      className={cn(
                        "flex w-full flex-col gap-0.5 px-4 py-3 text-start transition-colors hover:bg-accent/60",
                        !notification.isRead &&
                          "bg-accent/30 hover:bg-accent/50",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            !notification.isRead && "font-semibold",
                          )}
                        >
                          {notification.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRelativeTime(notification.createdAt, t)}
                        </span>
                      </span>
                      <span className="text-xs leading-snug text-muted-foreground">
                        {notification.message}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatRelativeTime(
  iso: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return t("notifications.time.justNow");
  }
  if (minutes < 60) {
    return t("notifications.time.minutesAgo", { count: minutes });
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t("notifications.time.hoursAgo", { count: hours });
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return t("notifications.time.daysAgo", { count: days });
  }
  return new Date(iso).toLocaleDateString();
}
