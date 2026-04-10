import { Priority, Status } from "../api";

export type AuthMode = "login" | "register";
export type TaskFilter =
  | "ALL"
  | "OPEN"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED"
  | "HIGH_PRIORITY";

export type TaskFormState = {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
};

export type AppFeedback = {
  title: string;
  message: string;
};
