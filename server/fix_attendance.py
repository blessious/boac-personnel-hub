import re

with open("C:/Users/admin/Videos/HRPMIS/src/routes/attendance.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add importAllDtr
content = content.replace(
    'importSingleDtr,',
    'importAllDtr,\n  importSingleDtr,'
)

# 2. Add showImportAllDialog state and related mass import states
states_insertion = """  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showImportAllDialog, setShowImportAllDialog] = useState(false);
  const [massImportSource, setMassImportSource] = useState<"biometric" | "file">("biometric");
  const [massImportFile, setMassImportFile] = useState<File | null>(null);
  const [massImportBiometricId, setMassImportBiometricId] = useState("");
  const [massImportStartDate, setMassImportStartDate] = useState(from);
  const [massImportEndDate, setMassImportEndDate] = useState(to);"""
content = re.sub(r'  const \[showImportDialog, setShowImportDialog\] = useState\(false\);', states_insertion, content)

# 3. Add openImportAll and runImportAll functions
functions_insertion = """  const openImportSingle = (employeeId: string) => {
    setSelectedImportEmployeeId(employeeId === "all" ? "" : employeeId);
    setShowImportDialog(true);
  };

  const openImportAll = () => {
    setMassImportSource("biometric");
    setMassImportFile(null);
    setMassImportStartDate(from);
    setMassImportEndDate(to);
    setMassImportBiometricId("");
    listBiometricDevices()
      .then((result) => {
        setBiometricDevices(result.devices);
        const defaultDevice = result.devices.find((device) => device.active);
        if (defaultDevice) setMassImportBiometricId(defaultDevice.id);
      })
      .catch(() => setBiometricDevices([]));
    setShowImportAllDialog(true);
  };

  const runImportAll = async () => {
    if (!massImportStartDate || !massImportEndDate) {
      toast.error("Select a start date and end date");
      return;
    }
    if (massImportSource === "biometric" && !massImportBiometricId) {
      toast.error("Select a biometric device first");
      return;
    }
    if (massImportSource === "file" && !massImportFile) {
      toast.error("Select a DTR file first");
      return;
    }
    setBusy(true);
    try {
      const payload: Parameters<typeof importAllDtr>[0] = {
        source: massImportSource,
        startDate: massImportStartDate,
        endDate: massImportEndDate,
      };
      if (massImportSource === "biometric") {
        payload.biometricId = massImportBiometricId;
      } else if (massImportFile) {
        payload.fileName = massImportFile.name;
        payload.fileBase64 = await fileToBase64(massImportFile);
      }
      const result = await importAllDtr(payload);
      toast.success(
        `Import DTR complete: ${result.imported} punch(es) imported; ${result.refreshed?.recordsProcessed || 0} DTR row(s) refreshed`,
      );
      if (result.errors?.length) toast.warning(`${result.errors.length} row(s) had errors`);
      setShowImportAllDialog(false);
      setMassImportFile(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to import DTR");
    } finally {
      setBusy(false);
    }
  };"""
content = re.sub(r'  const openImportSingle = \(employeeId: string\) => \{\n    setSelectedImportEmployeeId\(employeeId === "all" \? "" : employeeId\);\n    setShowImportDialog\(true\);\n  \};', functions_insertion, content)


# 4. Add "Import DTR" button
button_insertion = """            <Button variant="outline" onClick={openImportAll}>
              <Upload className="mr-2 h-4 w-4" />
              Import DTR
            </Button>
            <Button variant="outline" onClick={() => openImportSingle("all")}>"""
content = re.sub(r'            <Button variant="outline" onClick=\{\(\) => openImportSingle\("all"\)\}>', button_insertion, content)


# 5. Add Mass Import Dialog UI
dialog_insertion = """        </DialogContent>
      </Dialog>

      {/* ─── MASS IMPORT DTR (all employees) ────────────────────────────── */}
      <Dialog open={showImportAllDialog} onOpenChange={setShowImportAllDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import DTR</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Import attendance for <span className="font-semibold text-foreground">all employees</span> from a biometric device or file.
              DTR records are automatically refreshed after import.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Import Source</Label>
              <Select
                value={massImportSource}
                onValueChange={(value: "biometric" | "file") => setMassImportSource(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="biometric">Biometric Device</SelectItem>
                  <SelectItem value="file">File (TXT / XLSX / DAT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {massImportSource === "biometric" ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label>Biometric Device</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBiometricDialog(true)}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Device
                  </Button>
                </div>
                <Select value={massImportBiometricId} onValueChange={setMassImportBiometricId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select biometric device" />
                  </SelectTrigger>
                  <SelectContent>
                    {biometricDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id} disabled={!device.active}>
                        {device.name} — {device.ip_address}:{device.port}
                        {!device.active ? " (Inactive)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!biometricDevices.length && (
                  <p className="text-xs text-muted-foreground">No biometric devices configured yet.</p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>DTR File</Label>
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-4 py-5 text-center hover:bg-muted/50">
                  <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {massImportFile ? massImportFile.name : "Click to upload DTR file"}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    TXT, XLSX, or DAT — max 10 MB
                  </span>
                  <Input
                    type="file"
                    accept=".txt,.xlsx,.xls,.dat"
                    className="hidden"
                    onChange={(event: any) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!/\.(txt|xlsx|xls|dat)$/i.test(file.name)) {
                        toast.error("Only TXT, XLSX, XLS, and DAT files are supported");
                        event.target.value = "";
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error("File size must not exceed 10 MB");
                        event.target.value = "";
                        return;
                      }
                      setMassImportFile(file);
                    }}
                  />
                </label>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Start Date" type="date" value={massImportStartDate} onChange={setMassImportStartDate} />
              <Field label="End Date" type="date" value={massImportEndDate} onChange={setMassImportEndDate} />
            </div>

            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <strong>All employees</strong> — punches are matched by Employee No. or Biometric ID. Unmatched records are skipped. DTR is refreshed automatically after import.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportAllDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={runImportAll}
              disabled={busy}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {busy ? "Importing…" : "Import DTR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBiometricDialog} onOpenChange={setShowBiometricDialog}>"""
content = content.replace("        </DialogContent>\n      </Dialog>\n\n      <Dialog open={showBiometricDialog} onOpenChange={setShowBiometricDialog}>", dialog_insertion)

# 6. Replace table columns layout
table_header_old = """              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  {!isEmployee && <th className="w-[220px] px-4 py-3 font-semibold">Employee</th>}
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">AM In</th>
                  <th className="px-4 py-3 font-semibold">AM Out</th>
                  <th className="px-4 py-3 font-semibold">PM In</th>
                  <th className="px-4 py-3 font-semibold">PM Out</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Late</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  {canManage && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
                </tr>
              </thead>"""
table_header_new = """              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Biometric ID</th>
                  <th className="w-[220px] px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Office</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">AM In</th>
                  <th className="px-4 py-3 font-semibold">AM Out</th>
                  <th className="px-4 py-3 font-semibold">PM In</th>
                  <th className="px-4 py-3 font-semibold">PM Out</th>
                  <th className="px-4 py-3 font-semibold">Tardiness</th>
                  {canManage && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
                </tr>
              </thead>"""

table_body_old = """                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    {!isEmployee && (
                      <td className="px-4 py-3">
                        <p
                          className="truncate font-medium text-foreground"
                          title={entry.employeeName}
                        >
                          {entry.employeeName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {entry.employeeNo}
                        </p>
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-foreground">{entry.workDate}</td>
                    <td className="px-4 py-3">{entry.amIn || "-"}</td>
                    <td className="px-4 py-3">{entry.amOut || "-"}</td>
                    <td className="px-4 py-3">{entry.pmIn || "-"}</td>
                    <td className="px-4 py-3">{entry.pmOut || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          STATUS_CLASS[entry.status] || "border-border bg-muted text-foreground"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {entry.lateMinutes ? `${entry.lateMinutes} min` : "-"}
                    </td>
                    <td className="px-4 py-3">{entry.source}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(entry)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!entries.length && !loading && (
                  <tr>
                    <td
                      colSpan={canManage ? 10 : isEmployee ? 8 : 9}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No DTR records found for this filter.
                    </td>
                  </tr>
                )}"""
table_body_new = """                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-muted-foreground">
                      {entry.biometricId || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate font-medium text-foreground" title={entry.employeeName}>
                        {entry.employeeName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.department || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{entry.workDate}</td>
                    <td className="px-4 py-3">{entry.amIn || "-"}</td>
                    <td className="px-4 py-3">{entry.amOut || "-"}</td>
                    <td className="px-4 py-3">{entry.pmIn || "-"}</td>
                    <td className="px-4 py-3">{entry.pmOut || "-"}</td>
                    <td className="px-4 py-3 text-destructive font-medium">
                      {entry.lateMinutes ? `${entry.lateMinutes} min` : "-"}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(entry)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!entries.length && !loading && (
                  <tr>
                    <td
                      colSpan={canManage ? 10 : 9}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No DTR records found for this filter.
                    </td>
                  </tr>
                )}"""

content = content.replace(table_header_old, table_header_new)
content = content.replace(table_body_old, table_body_new)

with open("C:/Users/admin/Videos/HRPMIS/src/routes/attendance.tsx", "w", encoding="utf-8") as f:
    f.write(content)
