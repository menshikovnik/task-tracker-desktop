import { X } from "lucide-react";
import { AppFeedback } from "../app/types";

type FeedbackToastProps = {
  feedback: AppFeedback;
  onDismiss: () => void;
};

export function FeedbackToast({ feedback, onDismiss }: FeedbackToastProps) {
  return (
    <div className="feedback-toast" role="alert">
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
