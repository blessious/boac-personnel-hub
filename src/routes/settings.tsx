import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { type AgencySettings, useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { agency, updateAgency } = useSettings();

  const saveAgency = async () => {
    try {
      const result = await api<{ agency: AgencySettings }>("/api/settings/agency", {
        method: "PUT",
        body: JSON.stringify(agency),
      });
      updateAgency(result.agency);
      toast.success("Agency profile updated");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <AppShell title="Settings" subtitle="Manage system branding and agency profile">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-1">Agency Branding</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Customize the system name and logo for your agency.
        </p>

        <div className="space-y-6 max-w-2xl">
          <div className="grid gap-2">
            <Label htmlFor="agency-name">Agency Name</Label>
            <Input
              id="agency-name"
              value={agency.name}
              onChange={(e) => updateAgency({ name: e.target.value })}
              placeholder="e.g. Agency Name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="agency-tagline">Tagline / Subtitle</Label>
            <Input
              id="agency-tagline"
              value={agency.tagline}
              onChange={(e) => updateAgency({ tagline: e.target.value })}
              placeholder="e.g. Marinduque LGU"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="agency-logo">Logo / Seal</Label>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  id="logo-file"
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateAgency({ logoUrl: reader.result as string });
                        toast.success("Logo uploaded");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="relative group shrink-0">
                <div
                  className={cn(
                    "h-24 w-24 rounded-xl grid place-items-center overflow-hidden shadow-sm",
                    agency.logoUrl ? "" : "border border-dashed border-border bg-muted/30",
                  )}
                >
                  {agency.logoUrl ? (
                    <img
                      src={agency.logoUrl}
                      alt="Logo Preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />
                  )}
                </div>
                {agency.logoUrl && (
                  <button
                    onClick={() => updateAgency({ logoUrl: "" })}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="agency-icon">System Icon (Favicon)</Label>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  id="icon-file"
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateAgency({ iconUrl: reader.result as string });
                        toast.success("Icon uploaded");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="relative group shrink-0">
                <div className="h-12 w-12 rounded-lg border border-dashed border-border bg-muted/30 grid place-items-center overflow-hidden shadow-sm">
                  {agency.iconUrl ? (
                    <img
                      src={agency.iconUrl}
                      alt="Icon Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-[9px] text-muted-foreground">1:1</div>
                  )}
                </div>
                {agency.iconUrl && (
                  <button
                    onClick={() => updateAgency({ iconUrl: "" })}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="agency-banner">Cover Photo (Login Page Background)</Label>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  id="banner-file"
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateAgency({ bannerUrl: reader.result as string });
                        toast.success("Cover photo uploaded");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="relative group shrink-0">
                <div
                  className={cn(
                    "h-20 w-32 rounded-lg grid place-items-center overflow-hidden shadow-sm",
                    agency.bannerUrl ? "" : "border border-dashed border-border bg-muted/30",
                  )}
                >
                  {agency.bannerUrl ? (
                    <img
                      src={agency.bannerUrl}
                      alt="Banner Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-[9px] text-muted-foreground">16:9</div>
                  )}
                </div>
                {agency.bannerUrl && (
                  <button
                    onClick={() => updateAgency({ bannerUrl: "" })}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={saveAgency}
              className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md hover:shadow-blue-500/20 transition-all duration-200"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
