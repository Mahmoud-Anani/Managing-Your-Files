"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { Spinner } from "@/components/ui/spinner";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isBooting } = useAuth();

  useEffect(() => {
    if (isBooting) {
      return;
    }
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [isBooting, isAuthenticated, isAdmin, router]);

  if (isBooting || !isAuthenticated || !isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex min-h-screen items-center justify-center"
      >
        <Spinner className="size-8 text-primary" />
      </motion.div>
    );
  }

  return <>{children}</>;
}
