import type React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastType = "default" | "success" | "info" | "warning" | "error";
type ToastPriority = "normal" | "high";

type ToastAddOptions = Omit<ExternalToast, "duration"> & {
  type?: ToastType;
  priority?: ToastPriority;
  title?: React.ReactNode;
  duration?: number;
};

type PromiseMessages<TData> = Parameters<typeof sonnerToast.promise<TData>>[1];

function add({ type = "default", priority = "normal", duration, ...options }: ToastAddOptions) {
  const { title, description, ...rest } = options;
  const message = title ?? description ?? "";
  const toastOptions: ExternalToast = {
    ...rest,
    description: title ? description : undefined,
    duration: duration ?? (priority === "high" ? 7000 : undefined),
  };

  if (type === "default") {
    return sonnerToast(message, toastOptions);
  }

  return sonnerToast[type](message, toastOptions);
}

export const toast = Object.assign(sonnerToast, {
  add,
  promise: <TData>(
    promise: Promise<TData> | (() => Promise<TData>),
    messages: PromiseMessages<TData>,
  ) => sonnerToast.promise(promise, messages),
});
