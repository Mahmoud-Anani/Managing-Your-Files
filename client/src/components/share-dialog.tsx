"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Share2 } from "lucide-react";

type ShareFormValues = { email: string; permission: "VIEW" | "EDIT" };

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
  onShared?: () => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
  onShared,
}: ShareDialogProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const schema = z.object({
    email: z.string().trim().email(t("validation.invalidEmail")),
    permission: z.enum(["VIEW", "EDIT"]),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShareFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", permission: "VIEW" },
  });

  const onSubmit = async (values: ShareFormValues) => {
    setError(null);
    setSuccess(false);
    try {
      await api.post(`/sharing/${fileId}`, values);
      setSuccess(true);
      reset();
      onShared?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("common.errorGeneric"));
      }
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    reset();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t("sharing.shareFile")}
      description={fileName}
      className="max-w-md"
    >
      {success ? (
        <Alert variant="success" className="mb-4">
          {t("sharing.shareSuccess")}
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shareEmail">{t("sharing.shareWithEmail")}</Label>
          <Input
            id="shareEmail"
            type="email"
            placeholder={t("sharing.emailPlaceholder")}
            autoComplete="email"
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sharePermission">{t("sharing.permissionLabel")}</Label>
          <select
            id="sharePermission"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("permission")}
          >
            <option value="VIEW">{t("sharing.viewOnly")}</option>
            <option value="EDIT">{t("sharing.canEdit")}</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <Share2 className="size-4 me-1" />
            {t("sharing.shareButton")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
