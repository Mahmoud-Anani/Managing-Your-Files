"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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

export default function VerifyEmailPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const raw = new URLSearchParams(window.location.search).get("email");
    return raw ? decodeURIComponent(raw) : "";
  });
  const [emailInput, setEmailInput] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [code, setCode] = useState("");

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

  const onSendCode = async () => {
    setError(null);
    setInfo(null);
    try {
      await api.post("/auth/resend-code", { email: emailInput });
      setEmail(emailInput);
      setInfo(t("auth.codeSent", { email: emailInput }));
      startResendCountdown();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("common.errorGeneric"));
      }
    }
  };

  const onVerify = async () => {
    setError(null);

    try {
      await api.post("/auth/verify-email", {
        email,
        code,
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
    if (!email) {
      return;
    }
    setError(null);
    setInfo(null);
    try {
      await api.post("/auth/resend-code", { email });
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
        <CardTitle>{t("auth.verifyTitle")}</CardTitle>
        <CardDescription>{t("auth.verifyDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!email ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSendCode();
            }}
            className="space-y-4"
          >
            {info ? <Alert variant="success">{info}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("common.emailPlaceholder")}
                autoComplete="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              {t("common.verifyEmail")}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onVerify();
            }}
            className="space-y-4"
          >
            {info ? <Alert variant="success">{info}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="code">{t("common.verificationCode")}</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t("common.codePlaceholder")}
                maxLength={6}
                autoFocus
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
              />
            </div>
            <Button type="submit" className="w-full">
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
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.alreadyHaveAccount")}{" "}
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
