import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)

  function validate(): Errors {
    const next: Errors = {}
    if (!name.trim()) next.name = 'Enter your name.'
    if (!email.trim()) next.email = 'Enter your email.'
    else if (!EMAIL_RE.test(email)) next.email = "That email address doesn't look right."
    if (!password) next.password = 'Choose a password.'
    else if (password.length < 8) next.password = 'Use at least 8 characters.'
    if (!confirm) next.confirm = 'Confirm your password.'
    else if (confirm !== password) next.confirm = "Passwords don't match."
    return next
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length === 0) {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <AuthShell>
        <div className="auth-placeholder">
          <p className="auth-placeholder__badge">Not a real account yet</p>
          <h1>Your details checked out</h1>
          <p>
            Accounts aren't connected to anything yet — there's no database
            behind this form. Nothing was saved, and no account for{' '}
            <strong>{email}</strong> exists anywhere.
          </p>
          <p>
            Once Supabase is wired up, this exact form will create a real,
            permanent account. For now you can still try the app with local
            demo data.
          </p>
          <Link className="btn btn--solid btn--lg btn--full" to="/app">
            Continue to demo dashboard
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="auth-title">Create your account</h1>
      <p className="auth-subtitle">
        Authentication isn't connected yet, so this won't create a real
        account — but the form validates properly so it's ready for when it does.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Field
          label="Name"
          value={name}
          onChange={setName}
          error={errors.name}
          autoComplete="name"
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <Field
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <button className="btn btn--solid btn--lg btn--full" type="submit">
          Create account
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthShell>
  )
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <Link className="auth-logo" to="/">
        <Logo />
      </Link>
      <div className="auth-card">{children}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
  autoComplete?: string
  hint?: string
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className={'input' + (error ? ' input--error' : '')}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <span className="field__error">{error}</span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </label>
  )
}
