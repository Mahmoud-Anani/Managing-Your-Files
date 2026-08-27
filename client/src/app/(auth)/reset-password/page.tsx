"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
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
import { PasswordRequirements } from "@/components/password-requirements";

type ResetPasswordFormValues = {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetPasswordSchema = useMemo(
    () =>
      z
        .object({
          email: z.email(t("validation.invalidEmail")),
          code: z.string().regex(/^\d{6}$/, t("validation.codeRequired")),
          password: z
            .string()
            .min(8, t("validation.passwordLength"))
            .regex(/\d/, t("validation.passwordNumber"))
            .regex(
              /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
              t("validation.passwordSpecial"),
            ),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("validation.passwordsMismatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", code: "", password: "", confirmPassword: "" },
  });

  const passwordValue = useWatch({ control, name: "password" });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setError(null);
    try {
      await api.post("/auth/reset-password", {
        email: values.email,
        code: values.code,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 2000);
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
        <CardTitle>{t("auth.resetPasswordTitle")}</CardTitle>
        <CardDescription>{t("auth.resetPasswordDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <Alert variant="success">{t("auth.passwordResetSuccess")}</Alert>
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("common.logIn")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">{t("auth.resetCode")}</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                invalid={Boolean(errors.code)}
                {...register("code")}
              />
              {errors.code ? (
                <p className="text-sm text-destructive">
                  {errors.code.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.newPassword")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("common.passwordPlaceholder")}
                autoComplete="new-password"
                invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
              <PasswordRequirements password={passwordValue ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("common.confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("common.passwordPlaceholder")}
                autoComplete="new-password"
                invalid={Boolean(errors.confirmPassword)}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" loading={isSubmitting}>
              {t("auth.resetPassword")}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.rememberPassword")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            {t("common.logIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
