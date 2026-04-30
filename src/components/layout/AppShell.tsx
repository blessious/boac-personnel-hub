import { type ReactNode, useEffect } from "react";
import { useSettings } from "@/lib/settings-context";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { setTitle, setSubtitle } = useSettings();

  useEffect(() => {
    setTitle(title);
    setSubtitle(subtitle ?? "");
  }, [title, subtitle, setTitle, setSubtitle]);

  return <>{children}</>;
}
