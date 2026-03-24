"use client";

import { create } from "zustand";

export type ToastTone = "teal" | "red" | "yellow" | "blue";

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastStore = {
  items: ToastItem[];
  show: (input: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  show: ({ message, tone }) =>
    set((state) => ({
      items: [...state.items, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, message, tone }],
    })),
  dismiss: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
}));

export const showToast = (message: string, tone: ToastTone) => {
  useToastStore.getState().show({ message, tone });
};

export const dismissToast = (id: string) => {
  useToastStore.getState().dismiss(id);
};
