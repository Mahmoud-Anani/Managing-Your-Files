"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function PasswordRequirements({ password }: { password: string }) {
  const { t } = useTranslation();

  const rules = [
    {
      label: t("validation.passwordMin"),
      met: password.length >= 8,
    },
    {
      label: t("validation.passwordNumber"),
      met: /\d/.test(password),
    },
    {
      label: t("validation.passwordSpecial"),
      met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    },
  ];

  return (
    <ul className="space-y-1 text-xs text-muted-foreground" aria-live="polite">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={cn(
            "transition-colors",
            rule.met
              ? "text-muted-foreground line-through decoration-2 decoration-foreground/80"
              : "text-muted-foreground/80",
          )}
        >
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
