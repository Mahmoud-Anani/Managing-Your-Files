"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSocket } from "@/lib/socket";
import { useToast } from "@/components/ui/toast";

export function useSocketEvents() {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const invalidateFiles = () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    };

    const invalidateAdmin = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-files"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    };

    const invalidateUsers = () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    };

    const invalidateSharing = () => {
      queryClient.invalidateQueries({ queryKey: ["sharing"] });
      queryClient.invalidateQueries({ queryKey: ["files", "trash"] });
    };

    const onFileUploaded = () => {
      invalidateFiles();
      invalidateSharing();
    };

    const onAdminFileUploaded = () => {
      invalidateAdmin();
      invalidateFiles();
    };

    const onFileDeleted = () => {
      invalidateFiles();
      queryClient.invalidateQueries({ queryKey: ["file"] });
    };

    const onAdminFileDeleted = () => {
      invalidateAdmin();
      invalidateFiles();
      queryClient.invalidateQueries({ queryKey: ["file"] });
    };

    const onFilePurged = () => {
      invalidateFiles();
      queryClient.invalidateQueries({ queryKey: ["file"] });
    };

    const onAdminFilePurged = () => {
      invalidateAdmin();
      invalidateFiles();
      queryClient.invalidateQueries({ queryKey: ["file"] });
    };

    const onFileRestored = () => {
      invalidateFiles();
      queryClient.invalidateQueries({ queryKey: ["file"] });
    };

    const onAdminFileRestored = () => {
      invalidateAdmin();
      invalidateFiles();
      queryClient.invalidateQueries({ queryKey: ["file"] });
    };

    const onUserUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    };

    const onAdminUserCreated = () => {
      invalidateUsers();
    };

    const onAdminUserUpdated = () => {
      invalidateUsers();
    };

    const onAdminUserRoleChanged = () => {
      invalidateUsers();
    };

    const onAdminUserDeleted = () => {
      invalidateUsers();
      invalidateAdmin();
    };

    const onShareCreated = () => {
      invalidateSharing();
      toast(t("sharing.shareSuccess"), "success");
    };

    const onShareRemoved = () => {
      invalidateSharing();
    };

    socket.on("file:uploaded", onFileUploaded);
    socket.on("admin:file:uploaded", onAdminFileUploaded);
    socket.on("file:deleted", onFileDeleted);
    socket.on("admin:file:deleted", onAdminFileDeleted);
    socket.on("file:purged", onFilePurged);
    socket.on("admin:file:purged", onAdminFilePurged);
    socket.on("file:restored", onFileRestored);
    socket.on("admin:file:restored", onAdminFileRestored);
    socket.on("user:updated", onUserUpdated);
    socket.on("admin:user:created", onAdminUserCreated);
    socket.on("admin:user:updated", onAdminUserUpdated);
    socket.on("admin:user:role-changed", onAdminUserRoleChanged);
    socket.on("admin:user:deleted", onAdminUserDeleted);
    socket.on("share:created", onShareCreated);
    socket.on("share:removed", onShareRemoved);

    return () => {
      socket.off("file:uploaded", onFileUploaded);
      socket.off("admin:file:uploaded", onAdminFileUploaded);
      socket.off("file:deleted", onFileDeleted);
      socket.off("admin:file:deleted", onAdminFileDeleted);
      socket.off("file:purged", onFilePurged);
      socket.off("admin:file:purged", onAdminFilePurged);
      socket.off("file:restored", onFileRestored);
      socket.off("admin:file:restored", onAdminFileRestored);
      socket.off("user:updated", onUserUpdated);
      socket.off("admin:user:created", onAdminUserCreated);
      socket.off("admin:user:updated", onAdminUserUpdated);
      socket.off("admin:user:role-changed", onAdminUserRoleChanged);
      socket.off("admin:user:deleted", onAdminUserDeleted);
      socket.off("share:created", onShareCreated);
      socket.off("share:removed", onShareRemoved);
    };
  }, [socket, queryClient, t, toast]);
}
