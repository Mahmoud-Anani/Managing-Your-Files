"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Spinner } from "@/components/ui/spinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isBooting } = useAuth();

  useEffect(() => {
    if (!isBooting && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isBooting, isAuthenticated, router]);

  if (isBooting || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
