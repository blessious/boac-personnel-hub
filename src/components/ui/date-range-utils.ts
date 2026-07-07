export type DateRangePreset = {
  label: string;
  getRange: () => { from: string; to: string };
};

export function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDefaultDateRangePresets(): DateRangePreset[] {
  return [
    {
      label: "Today",
      getRange: () => {
        const now = new Date();
        const date = formatLocalDate(now);
        return { from: date, to: date };
      },
    },
    {
      label: "Yesterday",
      getRange: () => {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        const value = formatLocalDate(date);
        return { from: value, to: value };
      },
    },
    {
      label: "This Week",
      getRange: () => {
        const date = new Date();
        const day = date.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const start = new Date(date);
        start.setDate(date.getDate() + mondayOffset);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { from: formatLocalDate(start), to: formatLocalDate(end) };
      },
    },
    {
      label: "This Month",
      getRange: () => {
        const date = new Date();
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return { from: formatLocalDate(start), to: formatLocalDate(end) };
      },
    },
    {
      label: "Current Pay Period",
      getRange: () => {
        const date = new Date();
        const startDay = date.getDate() <= 15 ? 1 : 16;
        const endDay =
          date.getDate() <= 15
            ? 15
            : new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        return {
          from: formatLocalDate(new Date(date.getFullYear(), date.getMonth(), startDay)),
          to: formatLocalDate(new Date(date.getFullYear(), date.getMonth(), endDay)),
        };
      },
    },
  ];
}
