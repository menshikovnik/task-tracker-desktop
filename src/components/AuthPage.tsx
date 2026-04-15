import { FormEvent, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { loginUser, normalizeApiError, registerUser, restoreAccessToken } from "../api";
import { useAuth } from "../auth";

type AuthMode = "login" | "register";

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const colors = ["", "#ef4444", "#f59e0b", "#f59e0b", "#10b981", "#10b981"];
  const labels = ["", "Weak", "Fair", "Fair", "Strong", "Strong"];

  return {
    score,
    width: `${(score / 5) * 100}%`,
    color: colors[score],
    label: labels[score],
  };
}

// GitHub mark SVG — the iconic Invertocat
function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[15px] w-[15px] shrink-0"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.468-2.382 1.236-3.222-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.807 5.625-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .32.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

// Minimal flux bolt icon
function FluxIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="h-[14px] w-[14px]">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

// Shared input styling — thin border, no ring, just border color on focus
const inputClass =
  "w-full rounded-lg border border-white/[0.08] bg-transparent px-3 py-2.5 text-[13px] text-white/90 outline-none transition-colors duration-100 placeholder:text-white/[0.18] focus:border-white/[0.22]";

// Shared label styling
const labelTextClass = "mb-1.5 block text-[11px] font-medium text-white/30";

export function AuthPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState<null | AuthMode>(null);
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const passwordStrength = useMemo(
    () => getPasswordStrength(registerForm.password),
    [registerForm.password],
  );
  const passwordsMismatch =
    registerForm.confirmPassword.length > 0 &&
    registerForm.password !== registerForm.confirmPassword;

  if (restoreAccessToken() && !entering) {
    return <Navigate replace to="/" />;
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setError("");
  }

  function startWorkspaceEntry(nextUser: string, nextMode: AuthMode) {
    setUser(nextUser);
    setEntering(nextMode);
    window.setTimeout(() => {
      navigate("/", { replace: true });
    }, 980);
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const identifier = loginForm.login.trim();
      await loginUser(
        identifier.includes("@")
          ? { email: identifier, password: loginForm.password }
          : { username: identifier, password: loginForm.password },
      );
      startWorkspaceEntry(
        identifier.includes("@") ? identifier.split("@")[0] : identifier,
        "login",
      );
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await registerUser({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
      });
      startWorkspaceEntry(registerForm.username.trim(), "register");
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-root flex min-h-screen items-center justify-center bg-[#0a0a0a] px-5 py-12">
      {/* ── Card ── */}
      <section className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-white/[0.08] text-white/70">
            <FluxIcon />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.2px] text-white/80">Flux</span>
        </div>

        {/* Heading — fades on mode switch */}
        <div className="auth-mode-panel mb-6" key={`heading-${mode}`}>
          <h1 className="text-[18px] font-semibold tracking-[-0.4px] text-white">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-1 text-[13px] text-white/35">
            {mode === "login"
              ? "Sign in to continue to Flux"
              : "Start tracking your work in minutes"}
          </p>
        </div>

        {/* GitHub button */}
        <button
          className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-[13px] font-medium text-white/75 transition-colors duration-100 hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white active:scale-[0.985]"
          type="button"
        >
          <GitHubIcon />
          Continue with GitHub
        </button>

        {/* "or" divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.07]" />
          <span className="text-[11px] text-white/25">or</span>
          <div className="h-px flex-1 bg-white/[0.07]" />
        </div>

        {/* Form — fades on mode switch */}
        <div className="auth-mode-panel" key={`form-${mode}`}>
          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/[0.18] bg-red-500/[0.07] px-3 py-2.5 text-[12px] text-red-400/90">
              {error}
            </div>
          ) : null}

          {mode === "login" ? (
            <form className="space-y-3" onSubmit={handleLoginSubmit}>
              <label className="block">
                <span className={labelTextClass}>Username or email</span>
                <input
                  autoComplete="username"
                  className={inputClass}
                  onChange={(e) =>
                    setLoginForm((c) => ({ ...c, login: e.target.value }))
                  }
                  placeholder="nick or nick@example.com"
                  value={loginForm.login}
                />
              </label>

              <label className="block">
                <span className={labelTextClass}>Password</span>
                <input
                  autoComplete="current-password"
                  className={inputClass}
                  onChange={(e) =>
                    setLoginForm((c) => ({ ...c, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  type="password"
                  value={loginForm.password}
                />
              </label>

              <button
                className="auth-submit-btn mt-1 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={loading}
                type="submit"
              >
                {loading ? <span className="auth-spinner" /> : null}
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={handleRegisterSubmit}>
              <label className="block">
                <span className={labelTextClass}>Username</span>
                <input
                  autoComplete="username"
                  className={inputClass}
                  onChange={(e) =>
                    setRegisterForm((c) => ({ ...c, username: e.target.value }))
                  }
                  placeholder="nickmenshikov"
                  value={registerForm.username}
                />
              </label>

              <label className="block">
                <span className={labelTextClass}>Email</span>
                <input
                  autoComplete="email"
                  className={inputClass}
                  onChange={(e) =>
                    setRegisterForm((c) => ({ ...c, email: e.target.value }))
                  }
                  placeholder="nick@example.com"
                  type="email"
                  value={registerForm.email}
                />
              </label>

              <label className="block">
                <span className={labelTextClass}>Password</span>
                <input
                  autoComplete="new-password"
                  className={inputClass}
                  onChange={(e) =>
                    setRegisterForm((c) => ({ ...c, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  type="password"
                  value={registerForm.password}
                />
                {registerForm.password ? (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-[width,background] duration-300"
                        style={{
                          width: passwordStrength.width,
                          background: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span
                      className="min-w-[34px] text-[11px]"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className={labelTextClass}>Confirm password</span>
                <input
                  autoComplete="new-password"
                  className={[
                    inputClass,
                    passwordsMismatch ? "border-red-500/30 focus:border-red-500/50" : "",
                  ].join(" ")}
                  onChange={(e) =>
                    setRegisterForm((c) => ({
                      ...c,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="••••••••"
                  type="password"
                  value={registerForm.confirmPassword}
                />
                {passwordsMismatch ? (
                  <p className="mt-1.5 text-[11px] text-red-400/80">
                    Passwords don't match
                  </p>
                ) : null}
              </label>

              <button
                className="auth-submit-btn mt-1 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={loading || passwordsMismatch}
                type="submit"
              >
                {loading ? <span className="auth-spinner" /> : null}
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}
        </div>

        {/* Mode toggle — simple text link */}
        <p className="mt-6 text-center text-[12px] text-white/25">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            className="text-white/50 underline-offset-2 transition-colors duration-100 hover:text-white/80 hover:underline"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            type="button"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </section>

      {/* ── Workspace entry transition (unchanged logic) ── */}
      {entering ? (
        <div className="auth-entry-transition fixed inset-0 z-20 flex items-center justify-center">
          <div className="auth-entry-transition__veil" />
          <div className="auth-entry-transition__card">
            <div className="auth-entry-transition__glow" />
            <div className="auth-entry-transition__pulse" />
            <span className="auth-entry-transition__eyebrow">Flux</span>
            <strong>
              {entering === "login" ? "Welcome back" : "Workspace created"}
            </strong>
            <p>
              {entering === "login"
                ? "Opening your projects and syncing your tasks."
                : "Launching your workspace and preparing your first project flow."}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
