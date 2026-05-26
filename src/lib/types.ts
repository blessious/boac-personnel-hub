export type EmploymentStatus = "PERMANENT" | "CASUAL" | "CONTRACTUAL" | "COTERMINOUS" | "ELECTED";

export function uid() {
  return Math.random().toString(36).substring(2, 9);
}
