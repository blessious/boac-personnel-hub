import { createFileRoute } from "@tanstack/react-router";
import { Database, PlugZap, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { type AgencySettings, useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const MAX_ICON_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_BRANDING_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_NAME_LENGTH = 120;
const MAX_TAGLINE_LENGTH = 180;

type BrandingField = "logoUrl" | "iconUrl" | "bannerUrl";

interface DatabaseSettings {
  host: string;
  port: number;
  user: string;
  database: string;
  passwordSet: boolean;
  source: string;
  restartRequired: boolean;
}

interface DatabaseDraft {
  host: string;
  port: string;
  user: string;
  database: string;
  password: string;
}

interface BrandingSpec {
  field: BrandingField;
  label: string;
  inputId: string;
  maxBytes: number | null;
  maxWidth: number | null;
  maxHeight: number | null;
  previewClassName: string;
  imageClassName: string;
  empty: ReactNode;
}

function normalizeAgency(settings: AgencySettings): AgencySettings {
  return {
    name: settings.name || "",
    tagline: settings.tagline || "",
    logoUrl: settings.logoUrl || "",
    iconUrl: settings.iconUrl || "",
    bannerUrl: settings.bannerUrl || "",
  };
}

function agencyEquals(a: AgencySettings, b: AgencySettings) {
  const left = normalizeAgency(a);
  const right = normalizeAgency(b);
  return (
    left.name === right.name &&
    left.tagline === right.tagline &&
    left.logoUrl === right.logoUrl &&
    left.iconUrl === right.iconUrl &&
    left.bannerUrl === right.bannerUrl
  );
}

function imageDimensions(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Image file could not be read"));
    image.src = dataUrl;
  });
}

function readFileDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Image file could not be read"));
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

async function readImageDataUrl(
  file: File | undefined,
  spec: BrandingSpec,
  onLoaded: (value: string) => void,
) {
  if (!file) return;
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
    toast.error("Image must be PNG, JPEG, WebP, or GIF");
    return;
  }
  if (spec.maxBytes && file.size > spec.maxBytes) {
    toast.error(`${spec.label} must be ${Math.round(spec.maxBytes / 1024 / 1024)} MB or smaller`);
    return;
  }
  try {
    const dataUrl = await readFileDataUrl(file);
    const dimensions = await imageDimensions(dataUrl);
    if (
      spec.maxWidth &&
      spec.maxHeight &&
      (dimensions.width > spec.maxWidth || dimensions.height > spec.maxHeight)
    ) {
      toast.error(`${spec.label} must be ${spec.maxWidth}x${spec.maxHeight}px or smaller`);
      return;
    }
    onLoaded(dataUrl);
    toast.success(`${spec.label} selected. Save changes to apply it.`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Unable to read image");
  }
}

function SettingsPage() {
  const { agency, updateAgency, loadAgencySettings } = useSettings();
  const [draft, setDraft] = useState<AgencySettings>(() => normalizeAgency(agency));
  const [saved, setSaved] = useState<AgencySettings>(() => normalizeAgency(agency));
  const savedRef = useRef(saved);
  const [saving, setSaving] = useState(false);
  const [removeField, setRemoveField] = useState<BrandingField | null>(null);
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseSettings | null>(null);
  const [databaseDraft, setDatabaseDraft] = useState<DatabaseDraft>({
    host: "",
    port: "3306",
    user: "",
    database: "",
    password: "",
  });
  const [clearDatabasePassword, setClearDatabasePassword] = useState(false);
  const [loadingDatabase, setLoadingDatabase] = useState(true);
  const [testingDatabase, setTestingDatabase] = useState(false);
  const [savingDatabase, setSavingDatabase] = useState(false);

  const dirty = useMemo(() => !agencyEquals(draft, saved), [draft, saved]);
  const nameLength = draft.name.trim().length;
  const taglineLength = draft.tagline.trim().length;
  const canSave =
    dirty &&
    !saving &&
    nameLength > 0 &&
    nameLength <= MAX_NAME_LENGTH &&
    taglineLength <= MAX_TAGLINE_LENGTH;

  useEffect(() => {
    const next = normalizeAgency(agency);
    const previousSaved = savedRef.current;
    savedRef.current = next;
    setSaved(next);
    setDraft((current) => (agencyEquals(current, previousSaved) ? next : current));
  }, [agency]);

  useEffect(() => {
    let alive = true;
    setLoadingDatabase(true);
    api<{ database: DatabaseSettings }>("/api/settings/database")
      .then(({ database }) => {
        if (!alive) return;
        setDatabaseConfig(database);
        setDatabaseDraft({
          host: database.host,
          port: String(database.port || 3306),
          user: database.user,
          database: database.database,
          password: "",
        });
        setClearDatabasePassword(false);
      })
      .catch((error) => {
        if (alive) toast.error((error as Error).message);
      })
      .finally(() => {
        if (alive) setLoadingDatabase(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const setDraftField = (field: keyof AgencySettings, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const setDatabaseDraftField = (field: keyof DatabaseDraft, value: string) => {
    setDatabaseDraft((current) => ({ ...current, [field]: value }));
  };

  const resetDraft = () => {
    setDraft(saved);
    toast.info("Unsaved changes discarded");
  };

  const confirmRemove = () => {
    if (!removeField) return;
    setDraftField(removeField, "");
    setRemoveField(null);
    toast.info("Branding image marked for removal. Save changes to apply it.");
  };

  const requestRemove = (field: BrandingField) => {
    if (saved[field]) {
      setRemoveField(field);
      return;
    }
    setDraftField(field, "");
  };

  const saveAgency = async () => {
    const payload = normalizeAgency({
      ...draft,
      name: draft.name.trim(),
      tagline: draft.tagline.trim(),
    });
    if (!payload.name) {
      toast.error("Agency name is required");
      return;
    }
    if (payload.name.length > MAX_NAME_LENGTH) {
      toast.error(`Agency name must be ${MAX_NAME_LENGTH} characters or fewer`);
      return;
    }
    if (payload.tagline.length > MAX_TAGLINE_LENGTH) {
      toast.error(`Tagline must be ${MAX_TAGLINE_LENGTH} characters or fewer`);
      return;
    }
    setSaving(true);
    try {
      const result = await api<{ agency: AgencySettings }>("/api/settings/agency", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const next = normalizeAgency(result.agency);
      savedRef.current = next;
      setSaved(next);
      setDraft(next);
      updateAgency(next);
      await loadAgencySettings();
      toast.success("Agency profile saved");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const databaseDirty = databaseConfig
    ? databaseDraft.host !== databaseConfig.host ||
      Number(databaseDraft.port) !== Number(databaseConfig.port || 3306) ||
      databaseDraft.user !== databaseConfig.user ||
      databaseDraft.database !== databaseConfig.database ||
      Boolean(databaseDraft.password) ||
      clearDatabasePassword
    : false;

  const databasePayload = () => {
    const payload: {
      host: string;
      port: number;
      user: string;
      database: string;
      password?: string;
    } = {
      host: databaseDraft.host.trim(),
      port: Number(databaseDraft.port || 3306),
      user: databaseDraft.user.trim(),
      database: databaseDraft.database.trim(),
    };
    if (clearDatabasePassword) payload.password = "";
    else if (databaseDraft.password) payload.password = databaseDraft.password;
    return payload;
  };

  const testDatabase = async () => {
    setTestingDatabase(true);
    try {
      await api<{ ok: boolean }>("/api/settings/database/test", {
        method: "POST",
        body: JSON.stringify(databasePayload()),
      });
      toast.success("Database connection verified");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setTestingDatabase(false);
    }
  };

  const saveDatabase = async () => {
    setSavingDatabase(true);
    try {
      const result = await api<{ database: DatabaseSettings }>("/api/settings/database", {
        method: "PUT",
        body: JSON.stringify(databasePayload()),
      });
      setDatabaseConfig(result.database);
      setDatabaseDraft({
        host: result.database.host,
        port: String(result.database.port || 3306),
        user: result.database.user,
        database: result.database.database,
        password: "",
      });
      setClearDatabasePassword(false);
      toast.success("Database configuration saved. Restart the HRIS server to use it.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSavingDatabase(false);
    }
  };

  const specs: BrandingSpec[] = [
    {
      field: "logoUrl",
      label: "Logo / Seal",
      inputId: "logo-file",
      maxBytes: MAX_BRANDING_IMAGE_BYTES,
      maxWidth: 2048,
      maxHeight: 2048,
      previewClassName: "h-24 w-24 rounded-xl",
      imageClassName: "h-full w-full object-contain",
      empty: <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />,
    },
    {
      field: "iconUrl",
      label: "System Icon (Favicon)",
      inputId: "icon-file",
      maxBytes: MAX_ICON_IMAGE_BYTES,
      maxWidth: 1024,
      maxHeight: 1024,
      previewClassName: "h-12 w-12 rounded-lg",
      imageClassName: "h-full w-full object-cover",
      empty: <div className="text-[9px] text-muted-foreground">1:1</div>,
    },
    {
      field: "bannerUrl",
      label: "Cover Photo (Login Page Background)",
      inputId: "banner-file",
      maxBytes: null,
      maxWidth: null,
      maxHeight: null,
      previewClassName: "h-20 w-32 rounded-lg",
      imageClassName: "h-full w-full object-cover",
      empty: <div className="text-[9px] text-muted-foreground">16:9</div>,
    },
  ];

  return (
    <AppShell title="Settings" subtitle="Manage system branding and agency profile">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-medium">Agency Branding</h3>
            <p className="text-sm text-muted-foreground">
              Changes are previewed here and applied after saving.
            </p>
          </div>
          {dirty && (
            <span className="w-fit rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="max-w-2xl space-y-6">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="agency-name">Agency Name</Label>
              <span className="text-xs text-muted-foreground">
                {nameLength}/{MAX_NAME_LENGTH}
              </span>
            </div>
            <Input
              id="agency-name"
              value={draft.name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(e) => setDraftField("name", e.target.value)}
              placeholder="e.g. Agency Name"
              aria-invalid={!nameLength || nameLength > MAX_NAME_LENGTH}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="agency-tagline">Tagline / Subtitle</Label>
              <span className="text-xs text-muted-foreground">
                {taglineLength}/{MAX_TAGLINE_LENGTH}
              </span>
            </div>
            <Input
              id="agency-tagline"
              value={draft.tagline}
              maxLength={MAX_TAGLINE_LENGTH}
              onChange={(e) => setDraftField("tagline", e.target.value)}
              placeholder="e.g. Marinduque LGU"
            />
          </div>

          {specs.map((spec) => (
            <BrandingInput
              key={spec.field}
              spec={spec}
              value={draft[spec.field] || ""}
              hasSavedValue={Boolean(saved[spec.field])}
              onChange={(value) => setDraftField(spec.field, value)}
              onRemove={() => requestRemove(spec.field)}
            />
          ))}

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={resetDraft}
              disabled={!dirty || saving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Discard
            </Button>
            <Button
              type="button"
              onClick={saveAgency}
              disabled={!canSave}
              className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md hover:shadow-blue-500/20 transition-all duration-200"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium">
              <Database className="h-5 w-5 text-[#2563eb]" />
              Database Configuration
            </h3>
            <p className="text-sm text-muted-foreground">
              Save MySQL connection settings without manually editing server files.
            </p>
          </div>
          {databaseConfig?.restartRequired && (
            <span className="w-fit rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
              Restart required
            </span>
          )}
        </div>

        <div className="max-w-2xl space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="grid gap-2">
              <Label htmlFor="db-host">Host</Label>
              <Input
                id="db-host"
                value={databaseDraft.host}
                onChange={(e) => setDatabaseDraftField("host", e.target.value)}
                placeholder="localhost"
                disabled={loadingDatabase || savingDatabase}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="db-port">Port</Label>
              <Input
                id="db-port"
                type="number"
                min={1}
                max={65535}
                value={databaseDraft.port}
                onChange={(e) => setDatabaseDraftField("port", e.target.value)}
                disabled={loadingDatabase || savingDatabase}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="db-name">Database Name</Label>
              <Input
                id="db-name"
                value={databaseDraft.database}
                onChange={(e) => setDatabaseDraftField("database", e.target.value)}
                placeholder="hris_db"
                disabled={loadingDatabase || savingDatabase}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="db-user">Username</Label>
              <Input
                id="db-user"
                value={databaseDraft.user}
                onChange={(e) => setDatabaseDraftField("user", e.target.value)}
                placeholder="root"
                disabled={loadingDatabase || savingDatabase}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="db-password">Password</Label>
              <span className="text-xs text-muted-foreground">
                {databaseConfig?.passwordSet ? "Saved password is hidden" : "No saved password"}
              </span>
            </div>
            <Input
              id="db-password"
              type="password"
              value={databaseDraft.password}
              onChange={(e) => {
                setDatabaseDraftField("password", e.target.value);
                if (e.target.value) setClearDatabasePassword(false);
              }}
              placeholder={
                databaseConfig?.passwordSet ? "Leave blank to keep saved password" : "Optional"
              }
              disabled={loadingDatabase || savingDatabase || clearDatabasePassword}
            />
            {databaseConfig?.passwordSet && (
              <label className="flex w-fit items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={clearDatabasePassword}
                  onChange={(e) => {
                    setClearDatabasePassword(e.target.checked);
                    if (e.target.checked) setDatabaseDraftField("password", "");
                  }}
                  disabled={loadingDatabase || savingDatabase}
                  className="h-4 w-4 rounded border-input"
                />
                Clear saved password on save
              </label>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Active source: {databaseConfig?.source || "loading"}. Saved changes apply after the
              server is restarted.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={testDatabase}
                disabled={loadingDatabase || testingDatabase || savingDatabase}
              >
                <PlugZap className="mr-2 h-4 w-4" />
                {testingDatabase ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                type="button"
                onClick={saveDatabase}
                disabled={loadingDatabase || savingDatabase || !databaseDirty}
                className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md hover:shadow-blue-500/20 transition-all duration-200"
              >
                <Save className="mr-2 h-4 w-4" />
                {savingDatabase ? "Saving..." : "Save Database"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={Boolean(removeField)}
        onOpenChange={(open) => !open && setRemoveField(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Saved Branding Image?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the saved image for removal. The change is applied only after you save the
              Settings form.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function BrandingInput({
  spec,
  value,
  hasSavedValue,
  onChange,
  onRemove,
}: {
  spec: BrandingSpec;
  value: string;
  hasSavedValue: boolean;
  onChange: (value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={spec.inputId}>{spec.label}</Label>
        <span className="text-xs text-muted-foreground">
          {spec.maxBytes ? `Max ${Math.round(spec.maxBytes / 1024 / 1024)} MB, ` : ""}
          {spec.maxWidth && spec.maxHeight ? `${spec.maxWidth}x${spec.maxHeight}px` : "No limit"}
        </span>
      </div>
      <div className="flex gap-4 items-start">
        <div className="flex-1">
          <input
            id={spec.inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => {
              readImageDataUrl(e.target.files?.[0], spec, onChange);
              e.currentTarget.value = "";
            }}
          />
          {value && !hasSavedValue && (
            <p className="mt-1 text-xs text-muted-foreground">Selected. Save changes to apply.</p>
          )}
        </div>
        <div className="relative group shrink-0">
          <div
            className={cn(
              "grid place-items-center overflow-hidden shadow-sm",
              spec.previewClassName,
              value ? "" : "border border-dashed border-border bg-muted/30",
            )}
          >
            {value ? (
              <img src={value} alt={`${spec.label} preview`} className={spec.imageClassName} />
            ) : (
              spec.empty
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${spec.label}`}
              title={`Remove ${spec.label}`}
              className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
