import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

export function StaticPageLayout({
  eyebrow,
  title,
  intro,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Container className={className}>
      <div className="mx-auto max-w-3xl">
        <div className="pb-10 pt-14 text-center sm:pb-14 sm:pt-20">
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {intro ? (
            <p
              className={cn(
                "mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground",
              )}
            >
              {intro}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </Container>
  );
}

export function ProseSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-8">
      {title ? (
        <h2 className="mb-2 font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
      ) : null}
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}
