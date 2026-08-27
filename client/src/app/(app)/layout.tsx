"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FileText,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Share2,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-provider";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { useSocketEvents } from "@/hooks/use-socket-events";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { PreferencesControls } from "@/components/preferences-controls";
import { ProtectedRoute } from "@/components/guards/protected-route";
import { cn } from "@/lib/utils";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { collapsed, toggle } = useSidebarCollapsed();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  useSocketEvents();

  const navItems: NavItem[] = [
    { href: "/dashboard", label: t("nav.overview"), icon: LayoutDashboard },
    { href: "/files", label: t("nav.files"), icon: FileText },
    { href: "/shared", label: t("nav.shared"), icon: Share2 },
    { href: "/storage", label: t("nav.storage"), icon: HardDrive },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
    { href: "/profile", label: t("nav.profile"), icon: User },
  ];

  if (isAdmin) {
    navItems.push({ href: "/admin", label: t("nav.admin"), icon: ShieldCheck });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        items={navItems}
        collapsed={collapsed}
        onToggle={toggle}
        className="hidden md:flex"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("nav.openMenu")}
            >
              <Menu className="size-5" />
            </Button>
            <p className="hidden truncate text-sm text-muted-foreground md:block">
              {t("dashboard.welcomeBack", { name: user?.name })}
            </p>
            <p className="truncate text-sm font-medium text-foreground md:hidden">
              {t("appShell.hello")}
            </p>
          </div>
          <PreferencesControls />
        </header>
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 p-4 md:p-8"
        >
          {children}
        </motion.main>
      </div>
      <MobileDrawer
        open={drawerOpen}
        items={navItems}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

function Sidebar({
  items,
  collapsed,
  onToggle,
  className,
}: {
  items: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-card",
        collapsed ? "w-16" : "w-60",
        "transition-[width] duration-200",
        className,
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-3">
        <Logo iconOnly={collapsed} className="flex-1" />
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? t("appShell.expandSidebar") : t("appShell.collapseSidebar")}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>
      <nav aria-label={t("appShell.primary")} className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map(({ href, label, icon: Icon }) => (
          <SidebarLink
            key={href}
            href={href}
            label={label}
            collapsed={collapsed}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
          </SidebarLink>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className={cn("flex flex-col", collapsed && "items-center")}>
          <span
            className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            aria-hidden
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name ?? ""} className="size-8 object-cover" />
            ) : (
              getInitials(user?.name)
            )}
          </span>
          {!collapsed ? (
            <>
              <p className="mt-2 w-full truncate text-sm font-medium text-foreground">
                {user?.name}
              </p>
              <p className="w-full truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "mt-2 w-full text-muted-foreground",
              collapsed && "px-0",
            )}
            onClick={logout}
            title={collapsed ? t("common.logOut") : undefined}
          >
            <LogOut className="size-4" />
            {!collapsed ? t("common.logOut") : null}
          </Button>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  collapsed,
  children,
}: {
  href: string;
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground",
      )}
    >
      {children}
      {!collapsed ? (
        <span className="truncate">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </Link>
  );
}

function MobileDrawer({
  open,
  items,
  onClose,
}: {
  open: boolean;
  items: NavItem[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { locale } = useI18n();
  const startX = locale === "ar" ? "100%" : "-100%";

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 cursor-default bg-foreground/40"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("appShell.menu")}
            initial={{ x: startX }}
            animate={{ x: 0 }}
            exit={{ x: startX }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col bg-card shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                autoFocus
                aria-label={t("common.close")}
                className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav aria-label={t("appShell.primary")} className="flex-1 overflow-y-auto p-3">
              {items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name ?? ""} className="size-9 object-cover" />
                  ) : (
                    getInitials(user?.name)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => {
                  onClose();
                  logout();
                }}
              >
                <LogOut className="size-4" />
                {t("common.logOut")}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function getInitials(name?: string): string {
  if (!name) {
    return "?";
  }
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
