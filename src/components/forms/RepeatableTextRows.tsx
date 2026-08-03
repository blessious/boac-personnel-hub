import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function rowsFromValue(value: string) {
  const rows = value.split(/\r?\n/);
  return rows.length ? rows : [""];
}

export function RepeatableTextRows({
  value,
  onChange,
  rowLabel = "Accomplishment or contribution",
  addLabel = "Add accomplishment or contribution",
}: {
  value: string;
  onChange: (value: string) => void;
  rowLabel?: string;
  addLabel?: string;
}) {
  const rows = rowsFromValue(value);

  const updateRow = (index: number, nextValue: string) => {
    const nextRows = [...rows];
    nextRows[index] = nextValue.replace(/[\r\n]+/g, " ");
    onChange(nextRows.join("\n"));
  };

  const addRow = () => onChange([...rows, ""].join("\n"));

  const removeRow = (index: number) => {
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
    onChange((nextRows.length ? nextRows : [""]).join("\n"));
  };

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={row}
            aria-label={`${rowLabel} ${index + 1}`}
            placeholder={`${rowLabel} ${index + 1}`}
            onChange={(event) => updateRow(index, event.target.value)}
          />
          {rows.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 text-destructive hover:text-destructive"
              aria-label={`Remove ${rowLabel.toLowerCase()} ${index + 1}`}
              onClick={() => removeRow(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-1.5 h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
