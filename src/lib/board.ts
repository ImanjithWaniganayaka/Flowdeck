export const COLUMNS = [
  { key: "todo", label: "To Do", accent: "var(--col-todo)" },
  { key: "progress", label: "In Progress", accent: "var(--col-progress)" },
  { key: "review", label: "Review", accent: "var(--col-review)" },
  { key: "done", label: "Done", accent: "var(--col-done)" },
] as const;

export type ColumnKey = (typeof COLUMNS)[number]["key"];

export const COLUMN_KEYS = COLUMNS.map((c) => c.key) as ColumnKey[];

export function columnLabel(key: string): string {
  return COLUMNS.find((c) => c.key === key)?.label ?? key;
}

export const CATEGORIES = [
  "general",
  "design",
  "development",
  "marketing",
  "research",
  "content",
  "admin",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_STYLES: Record<string, string> = {
  general: "bg-tag-general text-tag-general-foreground",
  design: "bg-tag-design text-tag-design-foreground",
  development: "bg-tag-development text-tag-development-foreground",
  marketing: "bg-tag-marketing text-tag-marketing-foreground",
  research: "bg-tag-research text-tag-research-foreground",
  content: "bg-tag-content text-tag-content-foreground",
  admin: "bg-tag-admin text-tag-admin-foreground",
};

export function categoryStyle(category: string): string {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES["general"]!;
}

export type Card = {
  id: string;
  title: string;
  description: string;
  column_key: string;
  position: number;
  due_date: string | null;
  time_estimate: string | null;
  category: string;
  created_at: string;
  updated_at: string;
};

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseDueDate(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function dueState(value: string | null): "none" | "overdue" | "soon" | "later" {
  const due = parseDueDate(value);
  if (!due) return "none";
  const today = startOfToday();
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days <= 2) return "soon";
  return "later";
}

export function formatDue(value: string | null): string {
  const due = parseDueDate(value);
  if (!due) return "";
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
