"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-provider";
import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/layout/container";
import { PreferencesControls } from "@/components/preferences-controls";
import { cn } from "@/lib/utils";

const linkButton =
  "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const linkButtonPrimary = cn(
  linkButton,
  "bg-primary text-primary-foreground hover:opacity-90",
);

const linkButtonOutline = cn(
  linkButton,
  "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
);

interface NavLinkItem {
  href: string;
  label: string;
}

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links: NavLinkItem[] = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50">
      <ScrollingNavbar>
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />
          <nav
            aria-label={t("nav.primary")}
            className="hidden items-center gap-1 md:flex"
          >
            {links.map((link) => (
              <DesktopNavLink key={link.href} {...link} pathname={pathname} />
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <PreferencesControls />
            {isAuthenticated ? (
              <div className="hidden md:block">
                <UserMenu />
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link href="/login" className={linkButtonOutline}>
                  {t("common.logIn")}
                </Link>
                <Link href="/register" className={linkButtonPrimary}>
                  {t("common.signUp")}
                </Link>
              </div>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("nav.openMenu")}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </ScrollingNavbar>
      <MobileMenu
        open={mobileOpen}
        links={links}
        pathname={pathname}
        onNavigate={() => setMobileOpen(false)}
      />
    </header>
  );
}

function ScrollingNavbar({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "border-b transition-[background-color,box-shadow,border-color] duration-200",
        scrolled
          ? "border-border bg-background/85 shadow-sm backdrop-blur"
          : "border-transparent bg-background",
      )}
    >
      <Container>{children}</Container>
    </div>
  );
}

function DesktopNavLink({
  href,
  label,
  pathname,
}: NavLinkItem & { pathname: string }) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground",
      )}
    >
      {label}
    </Link>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        {getInitials(user?.name)}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute inset-e-0 top-full z-50 mt-2 w-56 rounded-md border border-border bg-card p-1.5 shadow-lg"
          >
            <div className="border-b border-border px-2.5 py-2">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <MenuLink
              href="/dashboard"
              icon={<LayoutDashboard className="size-4" />}
              label={t("nav.overview")}
              onClick={close}
            />
            <MenuLink
              href="/profile"
              icon={<User className="size-4" />}
              label={t("nav.profile")}
              onClick={close}
            />
            {isAdmin ? (
              <MenuLink
                href="/admin"
                icon={<ShieldCheck className="size-4" />}
                label={t("nav.admin")}
                onClick={close}
              />
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              {t("common.logOut")}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileMenu({
  open,
  links,
  pathname,
  onNavigate,
}: {
  open: boolean;
  links: NavLinkItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { locale } = useI18n();
  const startX = locale === "ar" ? "100%" : "-100%";

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onNavigate();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onNavigate]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.button
            type="button"
            aria-label={t("common.close")}
            onClick={onNavigate}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 cursor-default bg-foreground/40"
          />
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menu")}
            initial={{ x: startX }}
            animate={{ x: 0 }}
            exit={{ x: startX }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col bg-card shadow-xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                type="button"
                onClick={onNavigate}
                autoFocus
                aria-label={t("common.close")}
                className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav aria-label={t("nav.primary")} className="flex-1 overflow-y-auto p-3">
              {links.map((link) => (
                <MobileNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  pathname={pathname}
                  onClick={onNavigate}
                />
              ))}
            </nav>
            <div className="border-t border-border p-4">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Link
                    href="/dashboard"
                    onClick={onNavigate}
                    className="flex w-full items-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    <LayoutDashboard className="size-4" />
                    {t("nav.overview")}
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={onNavigate}
                      className="flex w-full items-center gap-2 rounded-md bg-secondary px-3 py-2.5 text-sm font-medium text-secondary-foreground"
                    >
                      <ShieldCheck className="size-4" />
                      {t("nav.admin")}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate();
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-destructive"
                  >
                    <LogOut className="size-4" />
                    {t("common.logOut")}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/register" onClick={onNavigate} className={cn(linkButtonPrimary, "w-full")}>
                    {t("common.signUp")}
                  </Link>
                  <Link href="/login" onClick={onNavigate} className={cn(linkButtonOutline, "w-full")}>
                    {t("common.logIn")}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function MobileNavLink({
  href,
  label,
  pathname,
  onClick,
}: NavLinkItem & { pathname: string; onClick: () => void }) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground",
      )}
    >
      {label}
    </Link>
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
