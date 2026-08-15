"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EyeIcon, EyeOff } from "lucide-react";
import i18n from "@/lib/i18n";
import i18next from "i18next";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  // get the courent lang
  const currentLang = i18next.language || i18n.language;
  const [error, setError] = useState<string | null>(null);
  const [toggleShowPassword, setToggleShowPassword] = useState(false);
  const [verified] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("verified") === "1",
  );

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.email(t("validation.invalidEmail")),
        password: z.string().min(1, t("validation.passwordRequired")),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      await login(values);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("common.errorGeneric"));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.loginTitle")}</CardTitle>
        <CardDescription>{t("auth.loginDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {verified ? (
            <Alert variant="success">{t("auth.emailVerified")}</Alert>
          ) : null}
          {error ? <Alert variant="error">{error}</Alert> : null}
          <div className="space-y-2">
            <Label htmlFor="email">{t("common.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("common.emailPlaceholder")}
              autoComplete="email"
              invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("common.password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={toggleShowPassword ? "text" : "password"}
                placeholder={t("common.passwordPlaceholder")}
                autoComplete="current-password"
                invalid={Boolean(errors.password)}
                {...register("password")}
              />
              <span
                className={`cursor-pointer absolute ${currentLang==="en"?"right-3":"left-3"} top-1/2 -translate-y-1/2 text-muted-foreground`}
                onClick={() => setToggleShowPassword(!toggleShowPassword)}
              >
                {toggleShowPassword ? <EyeIcon /> : <EyeOff />}
              </span>
            </div>
            {errors.password ? (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            {t("common.logIn")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="font-medium text-primary hover:underline"
          >
            {t("auth.forgotPassword")}
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            {t("auth.createOne")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
