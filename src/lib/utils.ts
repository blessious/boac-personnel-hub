import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for denied clipboard permission and non-secure LAN access.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Clipboard copy was rejected");
    }
  } finally {
    textarea.remove();
  }
}

export function formatDisplayDate(value?: string | Date | null, fallback = "-") {
  const date = parseDisplayDate(value);
  if (!date) return value ? String(value) : fallback;

  return [
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getFullYear()),
  ].join("/");
}

export function formatDisplayDateTime(value?: string | Date | null, fallback = "-") {
  const date = parseDisplayDate(value);
  if (!date) return value ? String(value) : fallback;

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDisplayDateRange(
  from?: string | Date | null,
  to?: string | Date | null,
  fallback = "-",
) {
  const fromText = formatDisplayDate(from, fallback);
  const toText = formatDisplayDate(to, fallback);
  if (fromText === fallback && toText === fallback) return fallback;
  if (fromText === toText || toText === fallback) return fromText;
  if (fromText === fallback) return toText;
  return `${fromText} - ${toText}`;
}

function parseDisplayDate(value?: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const isoDateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatEmployeeName(
  employee?: {
    firstname?: string | null;
    middlename?: string | null;
    lastname?: string | null;
    nameExt?: string | null;
  } | null,
  fallback = "Employee",
) {
  if (!employee) return fallback;
  const middleName = String(employee.middlename || "").trim();
  const middlePart =
    middleName.length === 1 && !middleName.endsWith(".")
      ? `${middleName.toUpperCase()}.`
      : middleName;
  const name = [employee.firstname, middlePart, employee.lastname, employee.nameExt]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
  return name || fallback;
}

export function formatDtrSignatoryName(
  employee?: {
    firstname?: string | null;
    middlename?: string | null;
    lastname?: string | null;
    nameExt?: string | null;
  } | null,
  fallback = "",
) {
  if (!employee) return fallback;
  const middleName = String(employee.middlename || "").trim();
  const middleInitial = middleName ? `${middleName.charAt(0).toUpperCase()}.` : "";
  const name = [employee.firstname, middleInitial, employee.lastname, employee.nameExt]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
  return name || fallback;
}
