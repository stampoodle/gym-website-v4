export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span className="footer__brand">GYM TRAINA</span>
        <span className="footer__note">
          A training log for people who lift.
        </span>
        <span className="footer__copy">© {new Date().getFullYear()} GYM TRAINA</span>
      </div>
    </footer>
  )
}
