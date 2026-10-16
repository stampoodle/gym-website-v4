import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function NavBar() {
  return (
    <header className="nav">
      <div className="container nav__inner">
        <Link className="brand" to="/" aria-label="GYM TRAINA home">
          <Logo />
        </Link>

        <nav className="nav__actions" aria-label="Account">
          <Link className="btn btn--ghost" to="/login">
            Log in
          </Link>
          <Link className="btn btn--solid" to="/signup">
            Create account
          </Link>
        </nav>
      </div>
    </header>
  )
}
