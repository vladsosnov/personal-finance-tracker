"use client";

import { useState } from "react";
import { Button, Card, PasswordInput, Stack, Text, Title } from "@mantine/core";

type ChangePasswordCardProps = {
  isLoading: boolean;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
};

export const ChangePasswordCard = ({ isLoading, onSubmit }: ChangePasswordCardProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMatch = newPassword === confirmPassword;
  const isValid =
    currentPassword.trim().length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword.length > 0 &&
    passwordsMatch;

  const handleSubmit = async () => {
    if (!isValid) return;
    await onSubmit(currentPassword, newPassword);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <Card withBorder radius="md" p="lg">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <Stack gap="md">
          <div>
            <Title order={4}>Change password</Title>
            <Text c="dimmed" size="sm">Update your password using your current password for verification.</Text>
          </div>
          <PasswordInput
            label="Current password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.currentTarget.value)}
          />
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
            error={newPassword.length > 0 && newPassword.length < 8 ? "Must be at least 8 characters" : undefined}
          />
          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            error={confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : undefined}
          />
          <Button type="submit" loading={isLoading} disabled={!isValid}>
            Update password
          </Button>
        </Stack>
      </form>
    </Card>
  );
};
