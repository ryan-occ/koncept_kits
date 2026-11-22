import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ApiRequestError, api } from "../api";

type GateState = "checking" | "locked" | "open" | "error";

export function AccessGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const checkAccess = useCallback(async () => {
    setState("checking");
    setMessage(null);
    try {
      const status = await api.accessStatus();
      setState(!status.enabled || status.authenticated ? "open" : "locked");
    } catch {
      setState("error");
      setMessage("Could not verify access. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code) || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.login(code);
      setState("open");
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 429) {
        setMessage("Too many attempts. Please wait before trying again.");
      } else {
        setMessage(error instanceof Error ? error.message : "Could not verify the code.");
      }
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  if (state === "open") return children;

  return (
    <main className="access-screen">
      <section className="access-card" aria-labelledby="access-heading">
        <div className="brand">VANGUARD <span>DRAFT</span></div>
        {state === "checking" ? (
          <p className="access-message" role="status">Checking access…</p>
        ) : state === "error" ? (
          <>
            <h1 id="access-heading">Access unavailable</h1>
            <p className="access-intro">{message}</p>
            <button className="btn primary" type="button" onClick={() => void checkAccess()}>Try again</button>
          </>
        ) : (
          <>
            <p className="access-eyebrow">PRIVATE BUILD STUDIO</p>
            <h1 id="access-heading">Enter access code</h1>
            <p className="access-intro">Enter the six-digit code to continue.</p>
            <form className="access-form" onSubmit={submit}>
              <label htmlFor="access-code">Six-digit code</label>
              <input
                id="access-code"
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                type="password"
                value={code}
                onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                aria-describedby={message ? "access-error" : undefined}
                required
              />
              {message ? <p id="access-error" className="access-error" role="alert">{message}</p> : null}
              <button className="btn primary" type="submit" disabled={busy || code.length !== 6}>
                {busy ? <span className="spinner" /> : null}
                Continue
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
