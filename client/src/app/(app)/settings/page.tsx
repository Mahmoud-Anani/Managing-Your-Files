"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { api, uploadApi, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { User, Lock, Trash2, Camera } from "lucide-react";

type ProfileFormValues = { name: string };
type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
type DeleteFormValues = { password: string };

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, refreshUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  const profileSchema = z.object({
    name: z
      .string()
      .trim()
      .min(2, t("validation.nameRequired"))
      .max(100, t("validation.nameTooLong")),
  });

  const passwordSchema = z
    .object({
      currentPassword: z.string().min(1, t("validation.passwordRequired")),
      newPassword: z
        .string()
        .min(8, t("validation.passwordMin"))
        .regex(/\d/, t("validation.passwordNumber")),
      confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("validation.passwordsMismatch"),
      path: ["confirmPassword"],
    });

  const deleteSchema = z.object({
    password: z.string().min(1, t("validation.passwordRequired")),
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const {
    register: registerDelete,
    handleSubmit: handleSubmitDelete,
    formState: { errors: deleteErrors },
  } = useForm<DeleteFormValues>({
    resolver: zodResolver(deleteSchema),
    defaultValues: { password: "" },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setAvatarSuccess(false);
    setAvatarLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await uploadApi.post("/auth/avatar", formData);
      await refreshUser();
      setAvatarSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setAvatarError(err.message);
      } else {
        setAvatarError(t("common.errorGeneric"));
      }
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmitProfile = async (values: ProfileFormValues) => {
    setProfileError(null);
    setProfileSuccess(false);
    try {
      await api.put("/auth/profile", values);
      await refreshUser();
      setProfileSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setProfileError(err.message);
      } else {
        setProfileError(t("common.errorGeneric"));
      }
    }
  };

  const onSubmitPassword = async (values: PasswordFormValues) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await api.put("/auth/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      setPasswordSuccess(true);
      resetPassword();
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(err.message);
      } else {
        setPasswordError(t("common.errorGeneric"));
      }
    }
  };

  const onSubmitDelete = async (values: DeleteFormValues) => {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await api.delete("/auth/account", { data: values });
      setDeleteOpen(false);
      logout();
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message);
      } else {
        setDeleteError(t("common.errorGeneric"));
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="size-5" />
            {t("settings.avatarSection")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {avatarSuccess ? (
            <Alert variant="success" className="mb-4">{t("settings.avatarUpdated")}</Alert>
          ) : null}
          {avatarError ? (
            <Alert variant="error" className="mb-4">{avatarError}</Alert>
          ) : null}
          <div className="flex items-center gap-6">
            <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="size-20 rounded-full object-cover"
                />
              ) : (
                getInitials(user?.name)
              )}
            </span>
            <div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                loading={avatarLoading}
              >
                <Camera className="size-4 me-1" />
                {t("settings.uploadAvatar")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {t("settings.avatarHint")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            {t("settings.profileSection")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
            {profileSuccess ? (
              <Alert variant="success">{t("settings.profileUpdated")}</Alert>
            ) : null}
            {profileError ? <Alert variant="error">{profileError}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.fullName")}</Label>
              <Input
                id="name"
                placeholder={t("common.namePlaceholder")}
                autoComplete="name"
                invalid={Boolean(profileErrors.name)}
                {...registerProfile("name")}
              />
              {profileErrors.name ? (
                <p className="text-sm text-destructive">{profileErrors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t("common.email")}</Label>
              <Input value={user?.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">{t("settings.emailReadonly")}</p>
            </div>
            <Button type="submit" loading={isSubmittingProfile}>
              {t("settings.saveProfile")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5" />
            {t("settings.passwordSection")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            {passwordSuccess ? (
              <Alert variant="success">{t("settings.passwordChanged")}</Alert>
            ) : null}
            {passwordError ? <Alert variant="error">{passwordError}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("settings.currentPassword")}</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                invalid={Boolean(passwordErrors.currentPassword)}
                {...registerPassword("currentPassword")}
              />
              {passwordErrors.currentPassword ? (
                <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("common.newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(passwordErrors.newPassword)}
                {...registerPassword("newPassword")}
              />
              {passwordErrors.newPassword ? (
                <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("common.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(passwordErrors.confirmPassword)}
                {...registerPassword("confirmPassword")}
              />
              {passwordErrors.confirmPassword ? (
                <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>
              ) : null}
            </div>
            <Button type="submit" loading={isSubmittingPassword}>
              {t("settings.changePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            {t("settings.dangerZone")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">{t("settings.deleteDescription")}</p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            {t("settings.deleteAccount")}
          </Button>
        </CardContent>
      </Card>

      <Modal
        open={deleteOpen}
        onClose={() => {
          if (!deleteLoading) setDeleteOpen(false);
        }}
        title={t("settings.deleteConfirmTitle")}
        description={t("settings.deleteConfirmDescription")}
        className="max-w-md"
      >
        {deleteError ? (
          <Alert variant="error" className="mb-4">{deleteError}</Alert>
        ) : null}
        <form onSubmit={handleSubmitDelete(onSubmitDelete)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deletePassword">{t("common.password")}</Label>
            <Input
              id="deletePassword"
              type="password"
              placeholder={t("common.passwordPlaceholder")}
              autoComplete="current-password"
              invalid={Boolean(deleteErrors.password)}
              {...registerDelete("password")}
            />
            {deleteErrors.password ? (
              <p className="text-sm text-destructive">{deleteErrors.password.message}</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="destructive" loading={deleteLoading}>
              {t("settings.deleteForever")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
