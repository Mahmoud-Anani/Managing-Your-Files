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

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type VerifyFormValues = {
  code: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const registerSchema = useMemo(
    () =>
      z
        .object({
          name: z
            .string()
            .min(1, t("validation.nameRequired"))
            .max(100, t("validation.nameTooLong")),
          email: z.string().email(t("validation.invalidEmail")),
          password: z
            .string()
            .min(8, t("validation.passwordMin"))
            .regex(/\d/, t("validation.passwordNumber"))
            .regex(
              /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
              t("validation.passwordSpecial"),
            ),
          confirmPassword: z
            .string()
            .min(1, t("validation.confirmPasswordRequired")),
        })
        .refine((values) => values.password === values.confirmPassword, {
          message: t("validation.passwordsMismatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );

  const verifySchema = useMemo(
    () =>
      z.object({
        code: z
          .string()
          .length(6, t("validation.codeLength"))
          .regex(/^\d+$/, t("validation.codeDigits")),
      }),
    [t],
  );

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const passwordValue = useWatch({
    control: registerForm.control,
    name: "password",
  });

  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });

  const startResendCountdown = () => {
    setResendDisabled(true);
    setResendCountdown(60);
    const interval = window.setInterval(() => {
      setResendCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setResendDisabled(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const onRegister = async (values: RegisterFormValues) => {
    setError(null);
    setInfo(null);
    try {
      const { data } = await api.post<{ userId: string; email: string }>(
        "/auth/register",
        {
          name: values.name,
          email: values.email,
          password: values.password,
        },
      );
      setPendingEmail(data.email);
      setInfo(t("auth.codeSent", { email: data.email }));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("common.errorGeneric"));
      }
    }
  };

  const onVerify = async (values: VerifyFormValues) => {
    setError(null);
    try {
      await api.post("/auth/verify-email", {
        email: pendingEmail,
        code: values.code,
      });
      router.replace("/login?verified=1");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("common.errorGeneric"));
      }
    }
  };

  const onResend = async () => {
    if (!pendingEmail) {
      return;
    }
    setError(null);
    setInfo(null);
    try {
      await api.post("/auth/resend-code", { email: pendingEmail });
      setInfo(t("auth.codeResent"));
      startResendCountdown();
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
        <CardTitle>
          {pendingEmail ? t("auth.verifyTitle") : t("auth.registerTitle")}
        </CardTitle>
        <CardDescription>
          {pendingEmail
            ? t("auth.verifyDescription")
            : t("auth.registerDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!pendingEmail ? (
          <form
            onSubmit={registerForm.handleSubmit(onRegister)}
            className="space-y-4"
          >
            {error ? <Alert variant="error">{error}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.fullName")}</Label>
              <Input
                id="name"
                placeholder={t("common.namePlaceholder")}
                autoComplete="name"
                invalid={Boolean(registerForm.formState.errors.name)}
                {...registerForm.register("name")}
              />
              {registerForm.formState.errors.name ? (
                <p className="text-sm text-destructive">
                  {registerForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("common.emailPlaceholder")}
                autoComplete="email"
                invalid={Boolean(registerForm.formState.errors.email)}
                {...registerForm.register("email")}
              />
              {registerForm.formState.errors.email ? (
                <p className="text-sm text-destructive">
                  {registerForm.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("common.passwordPlaceholder")}
                autoComplete="new-password"
                invalid={Boolean(registerForm.formState.errors.password)}
                {...registerForm.register("password")}
              />
              {registerForm.formState.errors.password ? (
                <p className="text-sm text-destructive">
                  {registerForm.formState.errors.password.message}
                </p>
              ) : null}
              <PasswordRequirements password={passwordValue} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("common.confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("common.confirmPasswordPlaceholder")}
                autoComplete="new-password"
                invalid={Boolean(registerForm.formState.errors.confirmPassword)}
                {...registerForm.register("confirmPassword")}
              />
              {registerForm.formState.errors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {registerForm.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              className="w-full"
              loading={registerForm.formState.isSubmitting}
            >
              {t("auth.createAccount")}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={verifyForm.handleSubmit(onVerify)}
            className="space-y-4"
          >
            {info ? <Alert variant="success">{info}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="code">{t("common.verificationCode")}</Label>
              <Input
                id="code"
                inputMode="numeric"
                placeholder={t("common.codePlaceholder")}
                maxLength={6}
                autoFocus
                invalid={Boolean(verifyForm.formState.errors.code)}
                {...verifyForm.register("code")}
              />
              {verifyForm.formState.errors.code ? (
                <p className="text-sm text-destructive">
                  {verifyForm.formState.errors.code.message}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              className="w-full"
              loading={verifyForm.formState.isSubmitting}
            >
              {t("common.verifyEmail")}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {t("auth.didNotGetCode")}{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onResend}
                disabled={resendDisabled}
              >
                {resendDisabled
                  ? t("auth.resendIn", { count: resendCountdown })
                  : t("common.resendCode")}
              </button>
            </div>
          </form>
        )}
        {!pendingEmail ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              {t("common.logIn")}
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
