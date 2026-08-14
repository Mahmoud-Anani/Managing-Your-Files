"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Check, Globe, Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/contexts/i18n-provider";
import { localeNames, locales } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ThemeOption = "light" | "dark" | "system";

const themeOptions: Array<{
  value: ThemeOption;
  labelKey: string;
  icon: typeof Sun;
}> = [
  { value: "light", labelKey: "common.light", icon: Sun },
  { value: "dark", labelKey: "common.dark", icon: Moon },
  { value: "system", labelKey: "common.system", icon: Monitor },
];

const subscribeToMount = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
}

export function PreferencesControls() {
  return (
    <div className="flex items-center gap-1.5">
      <ThemeMenu />
      <LanguageMenu />
    </div>
  );
}

function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground"
        aria-label={t("common.theme")}
      >
        <Monitor className="size-4" />
      </button>
    );
  }

  const ActiveIcon =
    themeOptions.find((option) => option.value === theme)?.icon ?? Monitor;

  return (
    <Menu
      trigger={<ActiveIcon className="size-4" />}
      ariaLabel={t("common.theme")}
    >
      {themeOptions.map(({ value, labelKey, icon: OptionIcon }) => (
        <MenuItem
          key={value}
          active={theme === value}
          onClick={() => setTheme(value)}
          icon={<OptionIcon className="size-4" />}
          label={t(labelKey)}
        />
      ))}
    </Menu>
  );
}

function LanguageMenu() {
  const { locale, setLocale } = useI18n();
  const { t } = useTranslation();

  return (
    <Menu trigger={<Globe className="size-4" />} ariaLabel={t("common.language")}>
      {locales.map((value) => (
        <MenuItem
          key={value}
          active={locale === value}
          onClick={() => setLocale(value)}
          icon={
            <span className="w-4 text-center text-xs font-semibold">
              {value === "en" ? "EN" : "ع"}
            </span>
          }
          label={localeNames[value]}
        />
      ))}
    </Menu>
  );
}

function Menu({
  trigger,
  ariaLabel,
  children,
}: {
  trigger: React.ReactNode;
  ariaLabel: string;
  children: React.ReactNode;
}) {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {trigger}
      </button>
      {open ? (
        <div className="absolute end-0 top-full z-50 mt-1 w-40 rounded-md border border-border bg-card p-1 shadow-lg">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm transition-colors",
        active
          ? "bg-accent font-medium text-accent-foreground"
          : "text-foreground/80 hover:bg-accent/60 hover:text-accent-foreground",
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {active ? <Check className="size-3.5" /> : null}
    </button>
  );
}
