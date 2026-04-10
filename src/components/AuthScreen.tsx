import { FormEvent } from "react";
import { AuthMode } from "../app/types";

type AuthScreenProps = {
  authMode: AuthMode;
  authLoading: boolean;
  authForm: {
    username: string;
    password: string;
    confirmPassword: string;
  };
  onModeChange: (mode: AuthMode) => void;
  onAuthFormChange: (
    field: "username" | "password" | "confirmPassword",
    value: string,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AuthScreen({
  authMode,
  authLoading,
  authForm,
  onModeChange,
  onAuthFormChange,
  onSubmit,
}: AuthScreenProps) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-card__glow" />
        <div className="auth-card__content">
          <span className="eyebrow">Flux</span>
          <h1>Session-based desktop workflow, built for focus.</h1>
          <p className="auth-subtitle">
            Sign in to manage your tasks, inspect details, and create new work without
            breaking stride.
          </p>

          <div className="auth-tabs">
            <button
              className={authMode === "login" ? "is-active" : ""}
              onClick={() => onModeChange("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={authMode === "register" ? "is-active" : ""}
              onClick={() => onModeChange("register")}
              type="button"
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <label>
              Username
              <input
                autoComplete="username"
                onChange={(event) => onAuthFormChange("username", event.target.value)}
                required
                value={authForm.username}
              />
            </label>

            <label>
              Password
              <input
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                onChange={(event) => onAuthFormChange("password", event.target.value)}
                required
                type="password"
                value={authForm.password}
              />
            </label>

            {authMode === "register" ? (
              <label>
                Confirm password
                <input
                  autoComplete="new-password"
                  onChange={(event) => onAuthFormChange("confirmPassword", event.target.value)}
                  required
                  type="password"
                  value={authForm.confirmPassword}
                />
              </label>
            ) : null}

            <button className="primary-button" disabled={authLoading} type="submit">
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
