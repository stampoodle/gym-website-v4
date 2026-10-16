import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = Partial<Record<'email' | 'password', string>>

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)

  function validate(): Errors {
    const next: Errors = {}
    if (!email.trim()) next.email = 'Enter your email.'
    else if (!EMAIL_RE.test(email)) next.email = "That email address doesn't look right."
    if (!password) next.password = 'Enter your password.'
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
          <p className="auth-placeholder__badge">Not a real login yet</p>
          <h1>There's nothing to check this against</h1>
          <p>
            There's no account system connected yet, so we can't verify{' '}
            <strong>{email}</strong> against anything real — this didn't log
            you into an account, because none exist.
          </p>
          <p>
            Once Supabase is connected, this form will check your credentials
            properly. For now you can still try the app with local demo data.
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
      <h1 className="auth-title">Log in</h1>
      <p className="auth-subtitle">
        Authentication isn't connected yet, so this won't check a real
        account — but the form validates properly so it's ready for when it does.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field__label">Email</span>
          <input
            className={'input' + (errors.email ? ' input--error' : '')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className="field__error">{errors.email}</span>}
        </label>

        <label className="field">
          <span className="field__label">Password</span>
          <input
            className={'input' + (errors.password ? ' input--error' : '')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && (
            <span className="field__error">{errors.password}</span>
          )}
        </label>

        <button className="btn btn--solid btn--lg btn--full" type="submit">
          Log in
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/signup">Create one</Link>
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
