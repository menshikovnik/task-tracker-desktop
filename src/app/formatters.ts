import { Priority, Status } from "../api";

export function formatPriority(priority: Priority) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function formatStatus(status: Status) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(input: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(input));
}

export function formatFullDate(input: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(input));
}
