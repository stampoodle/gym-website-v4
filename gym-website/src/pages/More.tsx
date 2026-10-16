import { Link } from 'react-router-dom'
import { moreNavItems } from '../components/navItems'

export default function More() {
  return (
    <div className="page-stack">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">More</p>
          <h1 className="page-head__title">Everything else</h1>
        </div>
      </header>

      <ul className="more-menu">
        {moreNavItems.map((item) => (
          <li key={item.to}>
            <Link className="more-menu__row" to={item.to}>
              <span className="more-menu__icon">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
