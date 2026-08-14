"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface ContactFormValues {
  name: string;
  email: string;
  message: string;
}

export function ContactForm() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const contactSchema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("validation.nameRequired")),
        email: z.email(t("validation.invalidEmail")),
        message: z.string().trim().min(10, t("contact.messageTooShort")),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    toast(t("contact.successToast"), "success");
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">{t("contact.name")}</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            placeholder={t("common.namePlaceholder")}
            invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">{t("common.email")}</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder={t("common.emailPlaceholder")}
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">{t("contact.message")}</Label>
        <textarea
          id="contact-message"
          rows={6}
          placeholder={t("contact.messagePlaceholder")}
          aria-invalid={Boolean(errors.message)}
          className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          {...register("message")}
        />
        {errors.message ? (
          <p className="text-sm text-destructive">{errors.message.message}</p>
        ) : null}
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
        {t("contact.submit")}
      </Button>
    </form>
  );
}
