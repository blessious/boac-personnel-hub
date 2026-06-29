import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

type GenerationLoaderProps = {
  open: boolean;
  title?: string;
  description?: string;
  timeoutMs?: number;
  timeoutTitle?: string;
  timeoutDescription?: string;
  onDismiss?: () => void;
};

export function GenerationLoader({
  open,
  title = "Generating file",
  description = "Please wait while the document is being prepared.",
  timeoutMs = 30000,
  timeoutTitle = "Still preparing file",
  timeoutDescription = "This is taking longer than expected. You can keep waiting or dismiss this message while the request continues.",
  onDismiss,
}: GenerationLoaderProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimedOut(false);
      return;
    }
    const timeout = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [open, timeoutMs]);

  if (!open) return null;

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-background/70 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 text-center shadow-lg">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-700">
          <span className="absolute inset-1 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-blue-50">
            <FileText className="h-8 w-8 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          {timedOut ? timeoutTitle : title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {timedOut ? timeoutDescription : description}
        </p>
        {timedOut && onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-4 h-9 rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
