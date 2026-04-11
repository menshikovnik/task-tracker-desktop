import { X } from "lucide-react";
import { AppFeedback } from "../app/types";

type FeedbackToastProps = {
  closing: boolean;
  feedback: AppFeedback;
  onDismiss: () => void;
};

export function FeedbackToast({ closing, feedback, onDismiss }: FeedbackToastProps) {
  return (
    <div
      className={[
        "feedback-toast",
        feedback.tone === "success" ? "feedback-toast--success" : "",
        closing ? "is-closing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
    >
      <div className="feedback-toast__copy">
        <strong>{feedback.title}</strong>
        <p>{feedback.message}</p>
      </div>
      <button
        aria-label="Dismiss message"
        className="feedback-toast__close"
        onClick={onDismiss}
        type="button"
      >
        <X size={14} />
      </button>
    </div>
  );
}
