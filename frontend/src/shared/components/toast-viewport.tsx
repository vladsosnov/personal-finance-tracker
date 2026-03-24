"use client";

import { useEffect } from "react";
import { Notification, Stack } from "@mantine/core";
import { IconAlertCircle, IconCheck, IconInfoCircle } from "@tabler/icons-react";
import { dismissToast, useToastStore } from "@/shared/lib/toast-store";

const toastIconMap = {
  teal: <IconCheck size={18} stroke={2} />,
  red: <IconAlertCircle size={18} stroke={2} />,
  yellow: <IconAlertCircle size={18} stroke={2} />,
  blue: <IconInfoCircle size={18} stroke={2} />,
};

export const ToastViewport = () => {
  const items = useToastStore((state) => state.items);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const timeouts = items.map((item) =>
      window.setTimeout(() => {
        dismissToast(item.id);
      }, 3000)
    );

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [items]);

  if (!items.length) {
    return null;
  }

  return (
    <Stack
      gap="sm"
      style={{
        position: "fixed",
        top: 80,
        right: 16,
        zIndex: 300,
        width: "min(380px, calc(100vw - 32px))",
      }}
    >
      {items.map((item) => (
        <Notification
          key={item.id}
          color={item.tone}
          withCloseButton
          onClose={() => dismissToast(item.id)}
          icon={toastIconMap[item.tone]}
        >
          {item.message}
        </Notification>
      ))}
    </Stack>
  );
};
