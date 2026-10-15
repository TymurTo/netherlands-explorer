import { useState } from 'react';
import { api } from '../api/client.js';
export default function AuthForm({ onSuccess }) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});
    const fields = new FormData(event.currentTarget);
    try {
      const user = await api(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(fields)),
      });
      onSuccess(user);
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      const fields = Object.keys(err.fieldErrors || {});
      setError(
        fields.length && fields.every((field) => ['username', 'password'].includes(field))
          ? ''
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="tabs">
        <button
          className={`${mode === 'login' ? 'active' : ''} shine-button`}
          onClick={() => {
            setMode('login');
            setError('');
            setFieldErrors({});
          }}
        >
          Sign in
        </button>
        <button
          className={`${mode === 'register' ? 'active' : ''} shine-button`}
          onClick={() => {
            setMode('register');
            setError('');
            setFieldErrors({});
          }}
        >
          Register
        </button>
      </div>
      <p className="muted">Save places and share your experiences.</p>
      <form onSubmit={submit} className="stack">
        <label>
          Username
          <input
            name="username"
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? 'username-error' : undefined}
            required
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9_]+"
            autoComplete="username"
            placeholder="For example, traveller"
          />
        </label>
        {fieldErrors.username && (
          <p id="username-error" role="alert" className="error">
            {fieldErrors.username.join(' ')}
          </p>
        )}
        <small>3–32 characters: Latin letters, numbers or _.</small>
        <label>
          Password
          <input
            name="password"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="At least 8 characters"
          />
        </label>
        {fieldErrors.password && (
          <p id="password-error" role="alert" className="error">
            {fieldErrors.password.join(' ')}
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary shine-button" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </>
  );
}
