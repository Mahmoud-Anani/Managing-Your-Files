"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/layout/container";

interface FooterLink {
  href: string;
  label: string;
}

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const columns: Array<{ title: string; links: FooterLink[] }> = [
    {
      title: t("footer.product"),
      links: [
        { href: "/dashboard", label: t("nav.overview") },
        { href: "/files", label: t("nav.files") },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { href: "/about", label: t("nav.about") },
        { href: "/contact", label: t("nav.contact") },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { href: "/terms", label: t("nav.terms") },
        { href: "/privacy", label: t("nav.privacy") },
      ],
    },
    {
      title: t("footer.resources"),
      links: [{ href: "/faq", label: t("nav.faq") }],
    },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialLink
                href="https://github.com/Mahmoud-Anani/Managing-Your-Files"
                ariaLabel={t("footer.github")}
              >
                <GithubIcon />
              </SocialLink>
              <SocialLink href="https://x.com" ariaLabel={t("footer.x")}>
                <XIcon />
              </SocialLink>
              <SocialLink
                href="https://www.linkedin.com/in/mahmoud-anani"
                ariaLabel={t("footer.linkedin")}
              >
                <LinkedinIcon />
              </SocialLink>
            </div>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="mb-3 text-sm font-semibold tracking-tight">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-accent-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-2 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row">
          <p>{t("footer.copyright", { year })}</p>
          <p>{t("footer.madeWith")}</p>
        </div>
      </Container>
    </footer>
  );
}

function SocialLink({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </a>
  );
}

function GithubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
