import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isAfter, isToday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  return format(parseISO(dateString), "MMM d, yyyy");
}

export function formatDateRange(start: string, end: string): string {
  if (!start) return "";
  const startFormatted = formatDate(start);
  if (!end || start === end) return startFormatted;
  return `${startFormatted} — ${formatDate(end)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function isActiveStatus(renewalDueDate: string): "Active" | "Lapsed" {
  if (!renewalDueDate) return "Lapsed";
  const dueDate = parseISO(renewalDueDate);
  return isAfter(dueDate, new Date()) || isToday(dueDate)
    ? "Active"
    : "Lapsed";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
