"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BarChart3, Users } from "lucide-react";
import { AdminRoute } from "@/components/guards/admin-route";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <Shell>{children}</Shell>
    </AdminRoute>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const adminLinks = [
    { href: "/admin", label: t("nav.overview"), icon: BarChart3 },
    { href: "/admin/users", label: t("nav.users"), icon: Users },
  ];

  return (
    <div>
      <div className="mx-auto mb-6 flex max-w-5xl items-center gap-1">
        {adminLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
